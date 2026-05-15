export type NoteDto = {
  id: string;
  title: string;
  content: string;

  createdAt: string;
  updatedAt: string;
};

export type PaginatedNotesDto = {
  items: NoteDto[];

  page: number;
  limit: number;

  total: number;
  totalPages: number;
};