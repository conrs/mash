import { FilesystemRootNode, FilesystemNode, Filesystem, SimpleRootNode, FilesystemLeafNode, FilesystemRootNodeChildren } from "./core";
import { request } from "../util/request";

export class GithubBlogFilesystem extends Filesystem {
  constructor() {
    super(new SimpleRootNode(
      {
        "blog": new GithubRootNode(
          "https://api.github.com/repos/conrs/blog/contents/_posts"
        )
      }
    ));
  }
}

export class GithubRootNode extends FilesystemRootNode {
  private nodes: FilesystemRootNodeChildren
  constructor(
    private url: string) {
    super()
  }

  async children() {
    if(! this.nodes) {
      let resultText = await request({
        url: this.url
      }) as string

      let results = JSON.parse(resultText) as any[]

      this.nodes = {}

      results.forEach((result) => {
        switch(result.type) {
          case "file":
            this.nodes[result.name] = new GithubLeafNode(
              result.download_url
            );
            break;
          case "dir":
            this.nodes[result.name] = new GithubRootNode(
              result.url
            )
        }
      })
    }

    return this.nodes
  }
}

export class GithubLeafNode extends FilesystemLeafNode {
  private _contents: string
  constructor(
    private url: string) {
    super()
  }

  async contents() {
    if(!this._contents) {
      this._contents = await await request({
        url: this.url
      }) as string
    }

    return this._contents
  }
}