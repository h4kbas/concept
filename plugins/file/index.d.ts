import { ConceptPlugin, PluginConfig, ConceptEventType, ConceptListener } from '../../dist/types/plugin';
declare class FileSystemPlugin implements ConceptPlugin {
    readonly config: PluginConfig;
    private fsConfig;
    private block;
    setBlock(block: any): void;
    initialize(): Promise<void>;
    cleanup(): Promise<void>;
    registerListeners(): Map<ConceptEventType, ConceptListener>;
    getHooks(): {
        file: (params: any[], block?: any[]) => any[];
    };
    private ensureBaseDirectory;
    private getFullPath;
    private readFile;
    private writeFile;
    private appendFile;
    private copyFile;
    private moveFile;
    private deleteFile;
    private fileExists;
    private getFileInfo;
    private createDirectory;
    private removeDirectory;
    private listDirectory;
    private showDirectoryTree;
    private searchFiles;
    private findFiles;
    private grepFiles;
    private updateConfig;
    private showStats;
    private createBackup;
    private copyDirectory;
    private restoreBackup;
    private showHelp;
    private parseBlockContent;
}
export default FileSystemPlugin;
