/* eslint-disable @typescript-eslint/no-var-requires */
import { app, BrowserWindow, dialog, ipcMain, nativeTheme, net, protocol, shell } from "electron";
import * as path from "path";
import packageJson from "../package.json";
import { UserSettings } from "../types/global";
import { DATA_PATH, initUserDirs, loadSettings, saveSettings } from "./scripts/userData";
import { addBookImage, addBookImageBase64, deleteBook, readAllBooks, readBook, saveBook } from "./scripts/bookData";
import { checkForUpdate } from "./scripts/updates";
import { getGoogleBook, searchGoogleBooks } from "./api/googleBooks";
import { googleImageSearch } from "./api/googleImageSearch";
import { searchOpenLibrary, searchOpenLibraryWorkByISBN } from "./api/openLibrary";

const PORT = 5000;
const DEV_MODE = process.env.WYRM_ENV === "dev";
const SCREENSHOT_MODE = process.env.WYRM_PREV === "true";
const APP_VERSION = packageJson.version;

let settings: UserSettings;

function createWindow(): BrowserWindow {
  nativeTheme.themeSource = "dark";

  const mainWindow = new BrowserWindow({
    width: 1445,
    height: 815,
    minWidth: 1200,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
    },
    icon: "assets/icons/512x512.png",
  });
  mainWindow.removeMenu();

  if (DEV_MODE) {
    mainWindow.loadURL(`http://localhost:${PORT}`);
    if (!SCREENSHOT_MODE) {
      mainWindow.webContents.openDevTools();
    }
  } else {
    mainWindow.loadFile(path.join(__dirname, "../../index.html"));
  }

  // Create user data directories if not already present.
  initUserDirs();
  settings = loadSettings();
  settings.appVersion = APP_VERSION;

  if (!SCREENSHOT_MODE) {
    mainWindow.setBounds(settings.bounds);
  }

  mainWindow.on("close", function () {
    // only if already loaded, thx
    // use default size for screenshot mode
    if (settings && !SCREENSHOT_MODE) {
      settings.bounds = mainWindow.getBounds();
      saveSettings(settings, {}, (err) => {
        if (err) console.error(err);
      });
    }
  });

  return mainWindow;
}

app.on("ready", () => {
  console.log("Starting in " + (DEV_MODE ? "dev" : "prod") + " mode");
  if (SCREENSHOT_MODE) {
    console.log("Screenshot mode active");
  }

  let window = createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      window = createWindow();
    }
  });

  protocol.handle("localfile", (request) => {
    let url = request.url.slice("localfile://".length).replace(/\\/g, "/").replace(/ /g, "%20");
    if (url.charAt(0) !== "/") url = "/" + url;
    return net.fetch("file://" + url);
  });
  protocol.handle("bookimage", (request) => {
    let url = path
      .join(settings.booksDir, request.url.slice("bookimage://".length))
      .replace(/\\/g, "/")
      .replace(/ /g, "%20");
    if (url.charAt(0) !== "/") url = "/" + url;
    return net.fetch("file://" + url);
  });

  // Intercept a click on anchor with `target="_blank"`.
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http:") || url.startsWith("https:")) {
      try {
        shell.openExternal(url);
      } catch (error: unknown) {
        console.error(`Failed to open url: ${error}`);
      }
    }
    return { action: "deny" };
  });

  // --------- Bridge ---------

  ipcMain.on("checkVersion", (event) => {
    checkForUpdate(APP_VERSION).then((updateAvailable) => {
      if (updateAvailable) {
        event.reply("updateAvailable", updateAvailable);
      }
    });
  });

  ipcMain.on("getBookData", async (event, book: Book) => {
    // If using both search engines, get the Google Books data, then supplement with OpenLibrary.
    if (settings.searchEngines.includes("googleBooks") && settings.searchEngines.includes("openLibrary")) {
      let googleBookP: Promise<Book>;
      let olBookP: Promise<Book>;
      let googleBook: Book | null = null;
      let olBook: Book | null = null;

      // Run first two queries async.
      if (book.ids.googleBooksId) googleBookP = getGoogleBook(book.ids.googleBooksId, settings.googleApiKey);
      if (book.ids.isbn) olBookP = searchOpenLibraryWorkByISBN(book.ids.isbn);

      // Wait for data.
      if (book.ids.googleBooksId) googleBook = await googleBookP;
      if (book.ids.isbn) olBook = await olBookP;

      // If we didn't have either of the necessary ids, run those async.
      if (!olBook && googleBook.ids.isbn) olBookP = searchOpenLibraryWorkByISBN(googleBook.ids.isbn);
      if (!googleBook && olBook.ids.googleBooksId)
        googleBookP = getGoogleBook(olBook.ids.googleBooksId, settings.googleApiKey);

      // Wait on secondary data if any.
      if (!olBook && googleBook.ids.isbn) olBook = await olBookP;
      if (!googleBook && olBook.ids.googleBooksId) googleBook = await googleBookP;

      if (googleBook) book = googleBook;
      if (olBook) {
        // OpenLibrary author data also has IDs
        book.authors = olBook.authors;
        // OpenLibrary accurate to original publish date
        if (olBook.datePublished) book.datePublished = olBook.datePublished;
        // Ids
        if (!book.ids.googleBooksId && olBook.ids.googleBooksId) book.ids.googleBooksId = olBook.ids.googleBooksId;
        book.ids.openLibraryId = olBook.ids.openLibraryId;
        book.ids.amazonId = olBook.ids.amazonId;
        book.ids.goodreadsId = olBook.ids.goodreadsId;
        book.ids.internetArchiveId = olBook.ids.internetArchiveId;
        book.ids.libraryThingId = olBook.ids.libraryThingId;
        book.ids.oclcId = olBook.ids.oclcId;
        book.ids.wikidataId = olBook.ids.wikidataId;
      }
    }
    // If just using Google Books, fetch full data.
    else if (settings.searchEngines.includes("googleBooks")) {
      getGoogleBook(book.ids.googleBooksId, settings.googleApiKey).then((updatedBook) => {
        if (updatedBook) book = updatedBook;
      });
    }
    // If just using OpenLibrary, there's no more data to get.
    event.reply("receiveBookData", book);
  });

  ipcMain.on("searchBook", (event, q: string) => {
    if (settings.searchEngines.includes("googleBooks")) {
      searchGoogleBooks(q, settings.googleApiKey).then((res) => event.reply("searchBookResults", res));
    } else {
      searchOpenLibrary(q).then((res) => event.reply("searchBookResults", res));
    }
  });

  ipcMain.on("readAllBooks", (event) => {
    readAllBooks(settings.booksDir).then((res) => event.reply("receiveAllBooks", res));
  });

  ipcMain.on("readBook", (event, authorDir: string, filename: string) => {
    readBook(settings.booksDir, authorDir, filename).then((res) => event.reply("receiveBook", res));
  });

  ipcMain.on("saveBook", (event, book: Book) => {
    saveBook(settings.booksDir, book).then((res) => event.reply("bookSaved", res));
  });

  ipcMain.on("editBook", (event, book: Book, authorDir: string, filename: string) => {
    saveBook(settings.booksDir, book, authorDir, filename).then((res) => event.reply("bookSaved", res));
  });

  ipcMain.on("selectDataDir", async (event) => {
    dialog
      .showOpenDialog(window, {
        defaultPath: settings?.booksDir ?? "",
        properties: ["openDirectory"],
        buttonLabel: "Choose",
      })
      .then((result) => {
        if (result.filePaths[0]?.length) {
          event.reply("dirSelected", result.filePaths[0]);
        }
      });
  });

  ipcMain.on("loadSettings", (event) => {
    settings = loadSettings();
    settings.appVersion = APP_VERSION;
    event.reply("settingsLoaded", settings);
  });

  ipcMain.on("saveSettings", (event, newSettings: UserSettings, moveData: boolean) => {
    saveSettings(newSettings, { moveData, oldDir: settings.booksDir }, (err) => {
      if (err) {
        console.error(err);
        event.reply("error", err.message);
      }
      settings = newSettings;
      event.reply("settingsLoaded", settings);
    });
  });

  ipcMain.on("imageSearch", (event, author: string, title: string, page: number) => {
    if (settings.googleApiKey && settings.googleSearchEngineId) {
      googleImageSearch(settings.googleApiKey, settings.googleSearchEngineId, author, title, page).then((res) =>
        event.reply("imageSearchResults", res),
      );
    }
  });

  ipcMain.on("addBookImage", (event, book: Book, url: string) => {
    addBookImage(settings.booksDir, book, url).then(() => event.reply("bookImageAdded"));
  });

  ipcMain.on("addBookImageBase64", (event, book: Book, base64: string) => {
    addBookImageBase64(settings.booksDir, book, base64).then(() => event.reply("bookImageBase64Added"));
  });

  ipcMain.on("deleteBook", (event, book: Book) => {
    deleteBook(settings.booksDir, book).then(() => event.reply("bookDeleted"));
  });

  ipcMain.on("openBooksDir", (_event) => {
    if (settings.booksDir) {
      shell.openPath(settings.booksDir);
    }
  });

  ipcMain.on("openSettingsDir", (_event) => {
    shell.openPath(DATA_PATH);
  });

  ipcMain.on("getPlatform", (event) => {
    event.reply("platform", process.platform);
  });

  // ------- End Bridge -------
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
