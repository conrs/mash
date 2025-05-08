/*

Filesystem objects respond to "ls" and "cat" - so "ls" and "cat" can share a "filesystem object"

State:
- pwd
- tree

- can delegate to subtrees

TODO: get rid of instanceof, Either types
*/

import { Either, Left, Right } from "../util/either";

export class Filesystem {
    constructor(
      public root: FilesystemDirNode,
      public pwd: string[] = [] // each element is a "FileSystemLeafNode name" representing a path thru this tree
    ) {}
  
  
    async cd(path: string): Promise<boolean> {
      let sanitizedAbsolutePath = this.getSanitizedAbsolutePath(path)
      let node = await this.getNodeAtPath(path)
  
      if(node) {
        this.pwd = sanitizedAbsolutePath
        return true;
      }
  
      return false;
    }

    async getCurrentDir(): Promise<Either<CurrentPathNotADirectoryError, FilesystemDirNode>> {
        const node = await this.getNodeAtPath()

        if(node instanceof FilesystemDirNode) {
            return Right(node)
        } else {
            return Left(new CurrentPathNotADirectoryError())
        }
    }
  
    async getNodeAtPath(path: string = "."): Promise<FilesystemNode | undefined> {
      let sanitizedAbsolutePath = this.getSanitizedAbsolutePath(path)
  
      if(sanitizedAbsolutePath) {
        let currentNode: FilesystemNode = this.root
  
        while(sanitizedAbsolutePath.length > 0) {
          if(currentNode instanceof FilesystemLeafNode) {
            // We already hit a leaf but have more path; return undefined.
            return
          } else if(currentNode instanceof FilesystemDirNode) {
            let children: FilesystemDirNodeChildren = await currentNode.children()
            let childName = sanitizedAbsolutePath.shift()
            
            if(childName && children[childName]) {
              currentNode = children[childName]
            } else {
              return
            }
          }
        }
    
        return currentNode;
      }
    }
  
    private getSanitizedAbsolutePath(path: string): string[] {
      const pathTokens = path.split("/")
  
      const isAbsolutePath = pathTokens[0] === "";
  
      let absolutePath = isAbsolutePath ? pathTokens : this.pwd.concat(pathTokens)
  
  
      let sanitizedAbsolutePath: string[] = []
  
      // Remove any relative references (.., .) from the path, returning nothing if
      // the path is invalid.
  
      for(let i = 0; i < absolutePath.length; i++) {
        switch(absolutePath[i]) {
          case ".":
          case "":
            break;
          case "..":
            if(sanitizedAbsolutePath.length != 0) {
              sanitizedAbsolutePath.pop()
              break
            } else {
              return []
            }
          default:
            sanitizedAbsolutePath.push(absolutePath[i])
        }
      }
  
      return sanitizedAbsolutePath
    }
  }
  
  
  
  class CurrentPathNotADirectoryError extends Error {}

  export type FilesystemNode = FilesystemLeafNode | FilesystemDirNode
  
  export abstract class FilesystemLeafNode {
    abstract path: string
    abstract contents(): Promise<string> | string
  }
  
  export type FilesystemDirNodeChildren = {
    [name: string]: FilesystemNode
  }
  
  export abstract class FilesystemDirNode {
    abstract children(): Promise<FilesystemDirNodeChildren> | FilesystemDirNodeChildren
  }
  
  export class SimpleRootNode extends FilesystemDirNode {
   constructor(
     protected nodes: FilesystemDirNodeChildren
   ) {
    super()
   }
  
   children() {
     return this.nodes
   }
  }