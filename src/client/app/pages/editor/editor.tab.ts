import { WebUsbPort } from '../../shared/webusb/webusbport';

export enum OPERATION_STATUS {
    NOT_STARTED,
    STARTING,
    IN_PROGRESS,
    DONE,
    ERROR
};

export enum EDITOR_STATUS {
    WEBUSB_UNAVAILABLE,
    READY,
    CONNECTING,
    UPLOADING
};


export interface EditorTab {
    id: number;
    active: boolean;
    title: string;
    editor: any;
    port: WebUsbPort;
    term: any;
    connectionStatus?: OPERATION_STATUS;
    uploadStatus?: OPERATION_STATUS;
    editorStatus?: EDITOR_STATUS;
};
