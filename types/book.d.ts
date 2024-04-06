type Author = {
  name: string;
  birth?: string;
  death?: string;
};

type Book = {
  version: "2";
  title: string;
  authors: Author[];
  tags: string[];
  series: string;
  datePublished: string;
  dateRead: string;
  timestampAdded: number; // ms
  rating: number;
  notes: string;
  images: {
    hasImage: boolean;
    imageUpdated?: number;
  };
  ids: {
    isbn?: string;
    googleBooksId?: string;
    goodreadsId?: string;
    amazonId?: string;
    libraryThingId?: string;
    wikidataId?: string;
    openLibraryId?: string;
    internetArchiveId?: string;
    oclcId?: string;
  };
  cache: {
    authorDir?: string;
    filename?: string;
    filepath?: string;
    urlpath?: string;
    searchId?: string;
    image?: string;
    thumbnail?: string;
  };
};

type Book_v1 = {
  version: "1";
  title: string;
  authors: Author[];
  authorDir?: string;
  filename?: string;
  tags: string[];
  series?: string;
  datePublished?: string;
  dateRead?: string;
  timestampAdded?: number; // ms
  hasImage?: boolean;
  imageUpdated?: number;
  image?: string;
  thumbnail?: string;
  isbn?: string;
  googleBooksId?: string;
  goodreadsId?: string;
  amazonId?: string;
  libraryThingId?: string;
  wikidataId?: string;
  openLibraryId?: string;
  internetArchiveId?: string;
  oclcId?: string;
};

type BookImport = Book | Book_v1;
