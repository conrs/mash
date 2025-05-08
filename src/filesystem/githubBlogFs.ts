import { FilesystemDirNode, FilesystemNode, Filesystem, SimpleRootNode, FilesystemLeafNode, FilesystemDirNodeChildren } from "./core";
import { request } from "../util/request";

export class GithubBlogFilesystem extends Filesystem {
  constructor() {
    super(new SimpleRootNode(
      {
        "blog": new GithubRootNode(
          "https://api.github.com/repos/conrs/blog/contents/_posts",
          "/blog"
        )
      }
    ));
  }
}

export class GithubRootNode extends FilesystemDirNode {
  private nodes: FilesystemDirNodeChildren = {}
  constructor(
    private url: string,
    public path: string = ""
) {
    super()
  }

  async children() {
    if(Object.keys(this.nodes).length === 0) {
      let resultText = await request({
        url: this.url
      }) as string

      let results = JSON.parse(resultText) as any[]

      this.nodes = {}

      results.forEach((result) => {
        switch(result.type) {
          case "file":
            this.nodes[result.name] = new GithubLeafNode(
              result.download_url,
              this.path + "/" + result.name
            );
            break;
          case "dir":
            this.nodes[result.name] = new GithubRootNode(
              result.url,
              this.path + "/" + result.name
            )
        }
      })
    }

    return this.nodes
  }
}

export class GithubLeafNode extends FilesystemLeafNode {
  private _contents: string | undefined
  constructor(
    private url: string,
    public path: string) {
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