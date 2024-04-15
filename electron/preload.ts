import { contextBridge, ipcRenderer } from "electron";
import type { UserSettings } from "../types/global";

function ipcCallback(channel: string, callback: Function) {
  const subscription = (_event: any, ...args: any[]) => callback(...args);
  ipcRenderer.on(channel, subscription);
  return () => {
    ipcRenderer.removeListener(channel, subscription);
  };
}

export const api = {
  error: (callback: Function) => ipcCallback("error", callback),

  loadSettings: () => ipcRenderer.send("loadSettings"),
  saveSettings: (newSettings: UserSettings, moveData: boolean) =>
    ipcRenderer.send("saveSettings", newSettings, moveData),
  settingsLoaded: (callback: Function) => ipcCallback("settingsLoaded", callback),

  checkVersion: () => ipcRenderer.send("checkVersion"),
  updateAvailable: (callback: Function) => ipcCallback("updateAvailable", callback),

  getBookData: (book: Book) => ipcRenderer.send("getBookData", book),
  receiveBookData: (callback: Function) => ipcCallback("receiveBookData", callback),

  searchBook: (q: string) => ipcRenderer.send("searchBook", q),
  searchBookResults: (callback: Function) => ipcCallback("searchBookResults", callback),

  readAllBooks: () => ipcRenderer.send("readAllBooks"),
  receiveAllBooks: (callback: Function) => ipcCallback("receiveAllBooks", callback),

  readBook: (authorDir: string, filename: string) => ipcRenderer.send("readBook", authorDir, filename),
  receiveBook: (callback: Function) => ipcCallback("receiveBook", callback),

  saveBook: (book: Book) => ipcRenderer.send("saveBook", book),
  bookSaved: (callback: Function) => ipcCallback("bookSaved", callback),
  editBook: (book: Book, authorDir: string, filename: string) =>
    ipcRenderer.send("editBook", book, authorDir, filename),

  selectDataDir: () => ipcRenderer.send("selectDataDir"),
  dirSelected: (callback: Function) => ipcCallback("dirSelected", callback),

  imageSearch: (author: string, title: string, page: number) => ipcRenderer.send("imageSearch", author, title, page),
  imageSearchResults: (callback: Function) => ipcCallback("imageSearchResults", callback),

  addBookImage: (book: Book, url: string) => ipcRenderer.send("addBookImage", book, url),
  bookImageAdded: (callback: Function) => ipcCallback("bookImageAdded", callback),
  addBookImageBase64: (book: Book, base64: string) => ipcRenderer.send("addBookImageBase64", book, base64),
  bookImageBase64Added: (callback: Function) => ipcCallback("bookImageBase64Added", callback),

  deleteBook: (book: Book) => ipcRenderer.send("deleteBook", book),
  bookDeleted: (callback: Function) => ipcCallback("bookDeleted", callback),

  getPlatform: () => ipcRenderer.send("getPlatform"),
  platform: (callback: Function) => ipcCallback("platform", callback),

  openSettingsDir: () => ipcRenderer.send("openSettingsDir"),
  openBooksDir: () => ipcRenderer.send("openBooksDir"),
};

contextBridge.exposeInMainWorld("electronAPI", api);
