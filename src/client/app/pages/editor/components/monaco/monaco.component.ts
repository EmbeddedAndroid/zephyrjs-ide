import {
    AfterViewInit,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    Output,
    ViewChild
} from '@angular/core';

import { GitHubModalComponent } from '../github/github.modal.component';
import { WebUsbPort } from '../../../../shared/webusb/webusbport';
import { WebUsbService } from '../../../../shared/webusb/webusb.service';
import { EditorTab, OPERATION_STATUS, EDITOR_STATUS } from '../../editor.tab';
import { EditorModalMessage } from '../../editor.modal.message';


declare const monaco: any;


@Component({
    moduleId: module.id,
    selector: 'sd-monaco',
    providers: [WebUsbService],
    templateUrl: 'monaco.component.html',
    styleUrls: ['monaco.component.css']
})
export class MonacoComponent implements AfterViewInit {
    @Input('tab') tab: EditorTab;
    @Output() onWarning = new EventEmitter<EditorModalMessage>();
    @Output() onError = new EventEmitter<EditorModalMessage>();

    @ViewChild('editor')
    private editorView: ElementRef;

    @ViewChild('gitHubModal')
    private gitHubModal: GitHubModalComponent;

    private webusbService: WebUsbService = undefined;

    private initialCode: string = [
        'var gpio = require("gpio");',
        'var pins = require("arduino101_pins");',
        '',
        'var pin = gpio.open({',
        '   pin: pins.LED2,',
        '   direction: "out"',
        '});',
        '',
        'var toggle = false;',
        'var handle = setInterval(function () {',
        '    toggle = !toggle;',
        '    pin.write(toggle);',
        '}, 1000);'].join('\n');


    constructor(webusbService: WebUsbService) {
        this.webusbService = webusbService;
    }

    public ngAfterViewInit() {
        var onGotAmdLoader = () => {
            // Load monaco
            (<any>window).require.config({ paths: { 'vs': 'node_modules/monaco-editor/min/vs' } });
            (<any>window).require(['vs/editor/editor.main'], () => {
                this.initMonaco();
            });
        };

        // Load AMD loader if necessary
        if (!(<any>window).require) {
            var loaderScript = document.createElement('script');
            loaderScript.type = 'text/javascript';
            loaderScript.src = 'node_modules/monaco-editor/min/vs/loader.js';
            loaderScript.addEventListener('load', onGotAmdLoader);
            document.body.appendChild(loaderScript);
        } else {
            onGotAmdLoader();
        }
    }

    // Will be called once monaco library is available
    private initMonaco() {
        if (this.tab !== null && this.tab.editor === null) {
            if (this.editorView !== null) {
                let theme = 'vs-dark';

                if (monaco.editor.defineTheme !== undefined) {
                    monaco.editor.defineTheme('zephyrjs-ide', {
                        base: theme,
                        inherit: true,
                        rules: []
                    });

                    theme = 'zephyrjs-ide';
                }

                this.tab.editor = monaco.editor.create(this.editorView.nativeElement, {
                    value: this.initialCode,
                    language: 'javascript',
                    automaticLayout: true,
                    theme: theme
                });
            }
        }
    }


    // tslint:disable-next-line:no-unused-variable
    private mayConnect(): boolean {
        return this.webusbService.usb !== undefined &&
               this.tab.connectionStatus === OPERATION_STATUS.NOT_STARTED ||
               this.tab.connectionStatus === OPERATION_STATUS.ERROR;
    }

    // tslint:disable-next-line:no-unused-variable
    private onConnect() {
        this.tab.connectionStatus = OPERATION_STATUS.IN_PROGRESS;
        this.tab.editorStatus = EDITOR_STATUS.CONNECTING;

        let doConnect = () => {
            this.webusbService.onReceive = (data: string) => {
                this.tab.term.io.print(data);
            };

            this.webusbService.onReceiveError = (error: string) => {
                console.error(error);
            };

            this.webusbService.connect(this.tab.port)
            .then(() => {
                this.tab.connectionStatus = OPERATION_STATUS.DONE;
                this.tab.editorStatus = EDITOR_STATUS.READY;
            })
            .catch((error: DOMException) => {
                this.tab.connectionStatus = OPERATION_STATUS.ERROR;
                this.onError.emit({
                    header: 'Unable to connect to the device',
                    body: error.message});
            });
        };

        if (this.tab.port !== null) {
            doConnect();
        } else {
            this.webusbService.requestPort()
            .then((port: WebUsbPort) => {
                this.tab.port = port;
                doConnect();
            })
            .catch((error: DOMException) => {
                this.tab.connectionStatus = OPERATION_STATUS.NOT_STARTED;
                this.onError.emit({
                    header: 'Unable to connect to the device',
                    body: error.message});
            });
        }
    }

    // tslint:disable-next-line:no-unused-variable
    private mayUpload(): boolean {
        return this.webusbService.usb !== undefined &&
               this.tab.connectionStatus === OPERATION_STATUS.DONE &&
               this.tab.editor.getValue().length > 0 &&
               this.tab.uploadStatus !== OPERATION_STATUS.IN_PROGRESS &&
               this.tab.port !== null;
    }

    // tslint:disable-next-line:no-unused-variable
    private onUpload() {
        this.tab.uploadStatus = OPERATION_STATUS.IN_PROGRESS;
        this.tab.editorStatus = EDITOR_STATUS.UPLOADING;

        this.tab.port.run(this.tab.editor.getValue())
        .then((warning: string) => {
            this.tab.uploadStatus = OPERATION_STATUS.DONE;
            this.tab.editorStatus = EDITOR_STATUS.READY;

            if (warning !== undefined) {
                this.onWarning.emit({
                    header: 'There were problems uploading your file',
                    body: warning});
            }
        })
        .catch((error: DOMException) => {
            this.tab.connectionStatus = OPERATION_STATUS.NOT_STARTED;
            this.tab.uploadStatus = OPERATION_STATUS.NOT_STARTED;
            this.tab.editorStatus = EDITOR_STATUS.READY;
            this.onError.emit({
                header: 'Unable to upload file',
                body: error.message});
        });
    }

    // tslint:disable-next-line:no-unused-variable
    private onFetchFromGitHub() {
        this.gitHubModal.show();
    }

    // tslint:disable-next-line:no-unused-variable
    private onGitHubFileFetched(content: string) {
        this.tab.editor.setValue(content);
    }
}
