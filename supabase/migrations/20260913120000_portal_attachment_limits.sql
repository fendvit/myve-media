-- Chat attachments were accepted at any size and in any format: the bucket was
-- created with neither a size limit nor a MIME whitelist, so the only filter was
-- the client, and a client check is bypassable by calling storage directly.
--
-- The list mirrors ATTACHMENT_TYPES in src/portal/lib/db.ts — pictures of the
-- thing the client is asking about, plus the document formats a small business
-- actually sends. Keep the two in step: the upload passes an explicit
-- contentType, and anything outside this list is rejected here with 400.

update storage.buckets
set
  file_size_limit = 10000000,  -- 10 MB, same number the portal shows the client
  allowed_mime_types = array[
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'image/avif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv'
  ]
where id = 'portal-attachments';

-- Logos are admin-only and already checked client-side for image/* under 2 MB;
-- this makes the bucket say the same thing. SVG is deliberately left out: this
-- bucket is public and an SVG is a script-carrying document served from our own
-- origin. Raster only.
update storage.buckets
set
  file_size_limit = 2000000,
  allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif']
where id = 'portal-logos';
