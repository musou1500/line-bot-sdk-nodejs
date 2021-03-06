import { deepEqual, equal, ok } from "assert";
import { HTTPError, JSONParseError, RequestError } from "../lib/exceptions";
import { get, post, stream, del, postBinary } from "../lib/http";
import { getStreamData } from "./helpers/stream";
import { close, listen } from "./helpers/test-server";
import { readFileSync } from "fs";
import { join } from "path";

const pkg = require("../package.json");

const TEST_PORT = parseInt(process.env.TEST_PORT, 10);
const TEST_URL = `http://localhost:${TEST_PORT}`;

describe("http", () => {
  before(() => listen(TEST_PORT));
  after(() => close());

  it("get", () => {
    const testHeaders = {
      "test-header-key": "Test-Header-Value",
    };

    return get(`${TEST_URL}/get?x=10`, testHeaders).then((res: any) => {
      equal(res.method, "GET");
      equal(res.path, "/get");
      equal(res.query.x, "10");
      equal(res.headers["test-header-key"], testHeaders["test-header-key"]);
      equal(res.headers["user-agent"], `${pkg.name}/${pkg.version}`);
    });
  });

  it("post without body", () => {
    const testHeaders = {
      "test-header-key": "Test-Header-Value",
    };

    return post(`${TEST_URL}/post`, testHeaders).then((res: any) => {
      equal(res.method, "POST");
      equal(res.path, "/post");
      equal(res.headers["test-header-key"], testHeaders["test-header-key"]);
      equal(res.headers["user-agent"], `${pkg.name}/${pkg.version}`);
    });
  });

  it("post with body", () => {
    const testHeaders = {
      "test-header-key": "Test-Header-Value",
    };

    const testBody = {
      id: 12345,
      message: "hello, body!",
    };

    return post(
      `${TEST_URL}/post/body`,
      testHeaders,
      testBody,
    ).then((res: any) => {
      equal(res.method, "POST");
      equal(res.path, "/post/body");
      equal(res.headers["test-header-key"], testHeaders["test-header-key"]);
      equal(res.headers["user-agent"], `${pkg.name}/${pkg.version}`);
      deepEqual(res.body, testBody);
    });
  });

  it("stream", () => {
    const testHeaders = {
      "test-header-key": "Test-Header-Value",
    };

    return stream(`${TEST_URL}/stream.txt`, testHeaders)
      .then(s => getStreamData(s))
      .then(result => {
        equal(result, "hello, stream!\n");
      });
  });

  it("delete", () => {
    const testHeaders = {
      "test-header-key": "Test-Header-Value",
    };

    return del(`${TEST_URL}/delete`, testHeaders).then((res: any) => {
      equal(res.method, "DELETE");
      equal(res.path, "/delete");
      equal(res.headers["test-header-key"], testHeaders["test-header-key"]);
      equal(res.headers["user-agent"], `${pkg.name}/${pkg.version}`);
    });
  });

  it("postBinary", () => {
    const testHeaders = {
      "test-header-key": "Test-Header-Value",
    };

    const filepath = join(__dirname, "/helpers/LINE_Icon.png");
    const buffer = readFileSync(filepath);
    return postBinary(
      `${TEST_URL}/post`,
      testHeaders,
      buffer,
    ).then((res: any) => {
      equal(res.method, "POST");
      equal(res.path, "/post");
      equal(res.headers["test-header-key"], testHeaders["test-header-key"]);
      equal(res.headers["user-agent"], `${pkg.name}/${pkg.version}`);
      equal(res.headers["content-type"], "image/png");
    });
  });

  it("fail with 404", () => {
    return get(`${TEST_URL}/404`, {})
      .then(() => ok(false))
      .catch((err: HTTPError) => {
        ok(err instanceof HTTPError);
        equal(err.statusCode, 404);
      });
  });

  it("fail with wrong addr", () => {
    return get("http://domain.invalid", {})
      .then(() => ok(false))
      .catch((err: RequestError) => {
        ok(err instanceof RequestError);
        equal(err.code, "ENOTFOUND");
      });
  });
});
