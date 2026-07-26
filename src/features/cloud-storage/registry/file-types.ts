export enum FileType {
  Image = 'Image',
  Video = 'Video',
  Audio = 'Audio',
  Pdf = 'Pdf',
  Office = 'Office',
  Spreadsheet = 'Spreadsheet',
  Presentation = 'Presentation',
  Text = 'Text',
  Code = 'Code',
  Archive = 'Archive',
  Unknown = 'Unknown',
}

export const FileTypeMap: Record<string, string[]> = {
  [FileType.Image]: ["jpg", "jpeg", "png", "gif", "svg", "webp", "avif", "bmp", "ico", "tiff"],
  [FileType.Video]: ["mp4", "webm", "mov", "avi", "mkv", "flv", "wmv", "m4v"],
  [FileType.Audio]: ["mp3", "wav", "ogg", "flac", "aac", "m4a", "wma"],
  [FileType.Pdf]: ["pdf"],
  [FileType.Office]: ["doc", "docx", "rtf", "odt"],
  [FileType.Spreadsheet]: ["xls", "xlsx", "csv", "ods"],
  [FileType.Presentation]: ["ppt", "pptx", "odp"],
  [FileType.Text]: ["txt", "md", "log", "ini"],
  [FileType.Code]: ["ts", "tsx", "js", "jsx", "json", "css", "html", "xml", "yaml", "yml", "sh", "bat", "sql"],
  [FileType.Archive]: ["zip", "rar", "7z", "tar", "gz", "bz2"],
};
