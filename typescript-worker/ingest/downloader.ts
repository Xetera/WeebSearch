import * as fs from "fs";
import * as path from "path";
import * as R from "ramda";
import { Readable } from "stream";
import { request } from "../crawler/crawl";
import { SavedFile } from "../typings/ass-parser";
import { SpiderCallback } from "../typings/spidey";
import { processSavedFiles } from "./file_processor";
import { CommitPayload, PartialPayload } from "../typings/db";

const getWriteFile = (name: string) => fs.createWriteStream(
  path.join("downloads", name)
);

const processSingleFile =
  (url: string, inStream: Readable, outStream: fs.WriteStream) =>
    new Promise<SavedFile>((res, rej) => {
      inStream.pipe(outStream);
      outStream.on("finish", () => res([url, outStream.path as string]));
      outStream.on("error", rej);
    });

const extractFileName = (url: string) => url.split("/").pop();

const downloadUrl = (url: string, cookie) => request.get(url, {
  responseType: "stream",
  // server doesn't reply without a session
  headers: {
    Cookie: cookie
  }
});

export const processSubsComRu = async ({ selections, cookie, processFiles }: SpiderCallback) => {
  const LINK_PREPEND = "http://subs.com.ru/";
  const extractUrl = response => response.request.res.responseUrl;

  const links = selections.map(link => LINK_PREPEND + link.attribs.href);
  const test = links.slice(0, 30);

  const promises = test.map(url => downloadUrl(url, cookie));
  const downloads = await Promise.all(promises);

  const requestToStream = R.pipe(
    extractUrl,
    extractFileName,
    getWriteFile
  );

  const writeFiles = downloads.map(requestToStream);
  const streams = R.zipWith(
    async (download, file): Promise<PartialPayload> => {
      const [downloadURL, savePath] = await processSingleFile(download.config.url, download.data, file);
      return {
        downloadUrl: downloadURL,
        path: savePath
      };
    },
    downloads,
    writeFiles
  );

  const files = await Promise.all(streams);

  if (processFiles) {
    await processSavedFiles(files);
    // TODO: send data to file handler
  }
  return files;
};
