import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const loadEmailTemplate = (filename: string) => {
  // Using workaround instead of `import.meta.dirname` because Webpack doesn't support the latter
  // and ES modules doesn't have __dirname
  // See https://github.com/webpack/webpack/issues/18320

 return fs.readFileSync(
   path.resolve(
     process.env.NODE_ENV === "production" ? process.cwd() : path.dirname(fileURLToPath(import.meta.url)),
     process.env.NODE_ENV === "production" ? "emailTemplates" : "../emailTemplates",
     filename
   ),
   "utf8"
 );
}

export const fillTemplate = (html: string, substitutions: [string, string][]) => {
  let newHtml = html;

  for (const sub of substitutions) {
    newHtml = newHtml.replace(sub[0], sub[1]);
  }

  return newHtml;
}