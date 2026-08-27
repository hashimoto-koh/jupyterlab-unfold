/* eslint-disable @typescript-eslint/ban-ts-comment */

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import {
  FileBrowser,
  FilterFileBrowserModel,
  IFileBrowserFactory
} from '@jupyterlab/filebrowser';

import { IDocumentManager } from '@jupyterlab/docmanager';

import { WidgetTracker } from '@jupyterlab/apputils';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { ITranslator } from '@jupyterlab/translation';

import { IStateDB } from '@jupyterlab/statedb';

import { FileTreeBrowser, FilterFileTreeBrowserModel } from './unfold';

const SETTINGS_ID = 'jupyterlab-unfold:jupyterlab-unfold-settings';

/**
 * The file browser namespace token.
 */
const namespace = 'filebrowser';

const fileBrowserFactory: JupyterFrontEndPlugin<IFileBrowserFactory> = {
  id: 'jupyterlab-unfold:FileBrowserFactory',
  provides: IFileBrowserFactory,
  requires: [IDocumentManager, ITranslator, ISettingRegistry],
  optional: [IStateDB],
  activate: async (
    app: JupyterFrontEnd,
    docManager: IDocumentManager,
    translator: ITranslator,
    settings: ISettingRegistry,
    state: IStateDB | null
  ): Promise<IFileBrowserFactory> => {
    const setting = await settings.load(SETTINGS_ID);
    const enabled = (setting.get('enabled').composite as boolean) ?? true;

    const tracker = new WidgetTracker<FileBrowser>({ namespace });
    const createFileBrowser = (
      id: string,
      options: IFileBrowserFactory.IOptions = {}
    ) => {
      const stateObj =
        options.state === null
          ? undefined
          : options.state || state || undefined;

      if (!enabled) {
        const model = new FilterFileBrowserModel({
          translator: translator,
          auto: options.auto ?? true,
          manager: docManager,
          driveName: options.driveName || '',
          refreshInterval: options.refreshInterval,
          state: stateObj
        });
        const widget = new FileBrowser({
          id,
          model,
          restore: options.restore,
          translator
        });

        // Track the newly created file browser.
        void tracker.add(widget);

        return widget;
      }

      const model = new FilterFileTreeBrowserModel({
        translator: translator,
        auto: options.auto ?? true,
        manager: docManager,
        driveName: options.driveName || '',
        refreshInterval: options.refreshInterval,
        state: stateObj
      });
      const widget = new FileTreeBrowser({
        id,
        model,
        restore: true,
        translator,
        app
      });

      widget.listing.singleClickToUnfold = setting.get('singleClickToUnfold')
        .composite as boolean;

      setting.changed.connect(() => {
        widget.listing.singleClickToUnfold = setting.get('singleClickToUnfold')
          .composite as boolean;
      });

      // check the url in iframe and open
      app.restored.then(async () => {
        const windowPathname = window.location.pathname;
        const treeIndex = windowPathname.indexOf('/tree/');
        let path = windowPathname.substring(treeIndex + '/tree/'.length);
        path = decodeURIComponent(path);
        const content = await app.serviceManager.contents.get(path);
        if (content.type !== 'directory') {
          docManager.open(path);
        }
      });

      // Track the newly created file browser.
      void tracker.add(widget as any);

      return widget;
    };

    // @ts-ignore: DirListing._onPathChanged is private upstream, need to change this so we can remove the ignore
    return { createFileBrowser, tracker };
  }
};

export * from './unfold';

export default fileBrowserFactory;
