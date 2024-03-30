import { SearchResult } from "@api/imagesearch";
import { Book } from "@data/book";
import { contextBridge, ipcRenderer } from "electron";

export const api = {
  getBookData: (id: string) => ipcRenderer.send("getBookData", id),
  receiveBookData: (callback: Function) => ipcRenderer.on("receiveBookData", (_event, res: Book) => callback(res)),

  searchBook: (q: string) => ipcRenderer.send("searchBook", q),
  searchBookResults: (callback: Function) =>
    ipcRenderer.on("searchBookResults", (_event, res: Book[]) => callback(res)),

  readAllBooks: () => ipcRenderer.send("readAllBooks"),
  receiveAllBooks: (callback: Function) => ipcRenderer.on("receiveAllBooks", (_event, res: Book[]) => callback(res)),

  readBook: (authorDir: string, filename: string) => ipcRenderer.send("readBook", authorDir, filename),
  receiveBook: (callback: Function) => ipcRenderer.on("receiveBook", (_event, res: Book) => callback(res)),

  saveBook: (book: Book) => ipcRenderer.send("saveBook", book),
  editBook: (book: Book, authorDir: string, filename: string) =>
    ipcRenderer.send("editBook", book, authorDir, filename),

  selectDataDir: () => ipcRenderer.send("selectDataDir"),
  dirSelected: (callback: Function) => ipcRenderer.on("dirSelected", (_event, path: string) => callback(path)),

  loadSettings: () => ipcRenderer.send("loadSettings"),
  settingsLoaded: (callback: Function) =>
    ipcRenderer.on("settingsLoaded", (_event, settings: object) => callback(settings)),

  imageSearch: (author: string, title: string) => ipcRenderer.send("imageSearch", author, title),
  imageSearchResults: (callback: Function) =>
    ipcRenderer.on("imageSearchResults", (_event, results: SearchResult[]) => callback(results)),

  addBookImage: (authorDir: string, filename: string, url: string) =>
    ipcRenderer.send("addBookImage", authorDir, filename, url),
};

contextBridge.exposeInMainWorld("electronAPI", api);
