import { Contents } from '@jupyterlab/services';
import {
  DirTreeListing,
  FileTreeRenderer,
  FilterFileTreeBrowserModel
} from '../unfold';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const schema = require('../../schema/jupyterlab-unfold-settings.json');

describe('jupyterlab-unfold', () => {
  describe('Settings Schema', () => {
    it('should have enabled property with default true', () => {
      expect(schema.properties).toHaveProperty('enabled');
      expect(schema.properties.enabled.type).toEqual('boolean');
      expect(schema.properties.enabled.default).toEqual(true);
    });

    it('should have singleClickToUnfold property with default true', () => {
      expect(schema.properties).toHaveProperty('singleClickToUnfold');
      expect(schema.properties.singleClickToUnfold.type).toEqual('boolean');
      expect(schema.properties.singleClickToUnfold.default).toEqual(true);
    });
  });

  describe('FileTreeRenderer Column Ordering', () => {
    let renderer: FileTreeRenderer;
    const itemModel: Contents.IModel = {
      name: 'foo.ipynb',
      path: 'foo.ipynb',
      format: 'text',
      type: 'notebook',
      created: '2026-08-20T00:00:00.000Z',
      last_modified: '2026-08-27T00:00:00.000Z',
      writable: true,
      mimetype: 'application/x-ipynb+json',
      size: 131072,
      content: null
    };

    beforeEach(() => {
      const mockModel = {
        isOpen: () => false
      } as unknown as FilterFileTreeBrowserModel;
      renderer = new FileTreeRenderer(mockModel);
    });

    function createTestNode(hiddenColumns: Set<string>): HTMLElement {
      const node = renderer.createItemNode(hiddenColumns as any);
      if (!hiddenColumns.has('date_created')) {
        const created = document.createElement('div');
        created.className = 'jp-DirListing-itemCreated';
        node.appendChild(created);
      }
      return node;
    }

    function getRenderedColumnClasses(node: HTMLElement): string[] {
      const classNames: string[] = [];
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i] as HTMLElement;
        if (
          child.classList.contains('jp-mod-hidden') ||
          child.classList.contains('jp-LastModified-hidden') ||
          child.classList.contains('jp-FileSize-hidden')
        ) {
          continue;
        }
        if (
          child.classList.contains('jp-DirListing-itemName') ||
          child.classList.contains('jp-DirListing-itemText')
        ) {
          classNames.push('Name');
        } else if (child.classList.contains('jp-DirListing-itemFileSize')) {
          classNames.push('Size');
        } else if (child.classList.contains('jp-DirListing-itemModified')) {
          classNames.push('Modified');
        } else if (child.classList.contains('jp-DirListing-itemCreated')) {
          classNames.push('Created');
        }
      }
      return classNames;
    }

    it('should render only Name when all columns are OFF', () => {
      const hiddenColumns = new Set<any>([
        'file_size',
        'last_modified',
        'date_created',
        'is_selected'
      ]);
      const node = createTestNode(hiddenColumns);
      renderer.updateItemNode(
        node,
        itemModel,
        undefined,
        undefined,
        hiddenColumns
      );

      expect(getRenderedColumnClasses(node)).toEqual(['Name']);
    });

    it('should render Name -> Size when Size is ON', () => {
      const hiddenColumns = new Set<any>([
        'last_modified',
        'date_created',
        'is_selected'
      ]);
      const node = createTestNode(hiddenColumns);
      renderer.updateItemNode(
        node,
        itemModel,
        undefined,
        undefined,
        hiddenColumns
      );

      expect(getRenderedColumnClasses(node)).toEqual(['Name', 'Size']);
    });

    it('should render Name -> Modified when Modified is ON', () => {
      const hiddenColumns = new Set<any>([
        'file_size',
        'date_created',
        'is_selected'
      ]);
      const node = createTestNode(hiddenColumns);
      renderer.updateItemNode(
        node,
        itemModel,
        undefined,
        undefined,
        hiddenColumns
      );

      expect(getRenderedColumnClasses(node)).toEqual(['Name', 'Modified']);
    });

    it('should render Name -> Created when Created is ON', () => {
      const hiddenColumns = new Set<any>([
        'file_size',
        'last_modified',
        'is_selected'
      ]);
      const node = createTestNode(hiddenColumns);
      renderer.updateItemNode(
        node,
        itemModel,
        undefined,
        undefined,
        hiddenColumns
      );

      expect(getRenderedColumnClasses(node)).toEqual(['Name', 'Created']);
    });

    it('should render Name -> Size -> Modified when Size and Modified are ON', () => {
      const hiddenColumns = new Set<any>(['date_created', 'is_selected']);
      const node = createTestNode(hiddenColumns);
      renderer.updateItemNode(
        node,
        itemModel,
        undefined,
        undefined,
        hiddenColumns
      );

      expect(getRenderedColumnClasses(node)).toEqual([
        'Name',
        'Size',
        'Modified'
      ]);
    });

    it('should render Name -> Size -> Created when Size and Created are ON', () => {
      const hiddenColumns = new Set<any>(['last_modified', 'is_selected']);
      const node = createTestNode(hiddenColumns);
      renderer.updateItemNode(
        node,
        itemModel,
        undefined,
        undefined,
        hiddenColumns
      );

      expect(getRenderedColumnClasses(node)).toEqual([
        'Name',
        'Size',
        'Created'
      ]);
    });

    it('should render Name -> Modified -> Created when Modified and Created are ON', () => {
      const hiddenColumns = new Set<any>(['file_size', 'is_selected']);
      const node = createTestNode(hiddenColumns);
      renderer.updateItemNode(
        node,
        itemModel,
        undefined,
        undefined,
        hiddenColumns
      );

      expect(getRenderedColumnClasses(node)).toEqual([
        'Name',
        'Modified',
        'Created'
      ]);
    });

    it('should render Name -> Size -> Modified -> Created when ALL are ON', () => {
      const hiddenColumns = new Set<any>(['is_selected']);
      const node = createTestNode(hiddenColumns);
      renderer.updateItemNode(
        node,
        itemModel,
        undefined,
        undefined,
        hiddenColumns
      );

      expect(getRenderedColumnClasses(node)).toEqual([
        'Name',
        'Size',
        'Modified',
        'Created'
      ]);
    });

    it('should dynamically update column ordering when column visibility changes', () => {
      // Start with all ON
      const hiddenColumns = new Set<any>(['is_selected']);
      const node = createTestNode(hiddenColumns);
      renderer.updateItemNode(
        node,
        itemModel,
        undefined,
        undefined,
        hiddenColumns
      );
      expect(getRenderedColumnClasses(node)).toEqual([
        'Name',
        'Size',
        'Modified',
        'Created'
      ]);

      // Hide Modified
      hiddenColumns.add('last_modified');
      renderer.updateItemNode(
        node,
        itemModel,
        undefined,
        undefined,
        hiddenColumns
      );
      expect(getRenderedColumnClasses(node)).toEqual([
        'Name',
        'Size',
        'Created'
      ]);

      // Unhide Modified, Hide Size
      hiddenColumns.delete('last_modified');
      hiddenColumns.add('file_size');
      renderer.updateItemNode(
        node,
        itemModel,
        undefined,
        undefined,
        hiddenColumns
      );
      expect(getRenderedColumnClasses(node)).toEqual([
        'Name',
        'Modified',
        'Created'
      ]);
    });
  });

  describe('DirTreeListing', () => {
    it('should trigger update when setColumnVisibility is called', () => {
      const mockModel = {
        fileChanged: { connect: jest.fn() },
        refreshed: { connect: jest.fn() },
        pathChanged: { connect: jest.fn() },
        sessions: () => [],
        items: () => [],
        manager: {
          services: { contents: {} },
          registry: { getFileTypeForModel: jest.fn() },
          activateRequested: { connect: jest.fn() }
        }
      } as any;
      const listing = new DirTreeListing({ model: mockModel });
      const updateSpy = jest.spyOn(listing, 'update');
      listing.setColumnVisibility('last_modified', true);
      expect(updateSpy).toHaveBeenCalled();
    });

    it('should toggle directory on handleOpen for directory item', () => {
      const toggleMock = jest.fn();
      const mockModel = {
        fileChanged: { connect: jest.fn() },
        refreshed: { connect: jest.fn() },
        pathChanged: { connect: jest.fn() },
        sessions: () => [],
        items: () => [],
        toggle: toggleMock,
        manager: {
          services: {
            contents: {
              localPath: (p: string) => p
            }
          },
          registry: { getFileTypeForModel: jest.fn() },
          activateRequested: { connect: jest.fn() }
        }
      } as any;
      const listing = new DirTreeListing({ model: mockModel });
      (listing as any).handleOpen({
        name: 'my-folder',
        path: 'my-folder',
        type: 'directory'
      });
      expect(toggleMock).toHaveBeenCalledWith('my-folder');
    });
  });

  describe('FilterFileTreeBrowserModel', () => {
    it('should toggle directory open state without auto-reopening on refresh', async () => {
      const mockContentsManager = {
        fileChanged: { connect: jest.fn() },
        get: jest.fn().mockImplementation((path: string) => {
          if (path === '') {
            return Promise.resolve({
              name: '',
              path: '',
              type: 'directory',
              content: [
                { name: 'folderA', path: 'folderA', type: 'directory' },
                { name: 'file1.txt', path: 'file1.txt', type: 'file' }
              ]
            });
          }
          if (path === 'folderA') {
            return Promise.resolve({
              name: 'folderA',
              path: 'folderA',
              type: 'directory',
              content: [
                {
                  name: 'subfile.txt',
                  path: 'folderA/subfile.txt',
                  type: 'file'
                }
              ]
            });
          }
          return Promise.resolve({ content: [] });
        })
      };

      const mockDocManager = {
        services: {
          contents: mockContentsManager,
          sessions: {
            running: () => [],
            runningChanged: { connect: jest.fn() }
          },
          ready: Promise.resolve()
        },
        registry: { getFileTypeForModel: jest.fn() }
      } as any;

      const model = new FilterFileTreeBrowserModel({
        manager: mockDocManager
      });

      // Initial state: folderA is closed
      await model.cd();
      expect(model.isOpen('folderA')).toBe(false);

      // Open folderA
      await model.toggle('folderA');
      expect(model.isOpen('folderA')).toBe(true);

      // Close folderA
      await model.toggle('folderA');
      expect(model.isOpen('folderA')).toBe(false);

      // Subsequent refresh should NOT reopen folderA
      await model.refresh();
      expect(model.isOpen('folderA')).toBe(false);
    });
  });
});
