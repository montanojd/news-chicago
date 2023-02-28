/**
 * @param cp {ContextController}
 */
function zuixEditor(cp) {
  const _browserSync = ___browserSync___;

  let btnAddPage;
  let btnEditPage;
  let btnDeletePage;
  let btnAddComponent;
  let brnRebuildAll;

  let modalView;
  let editMode = {};
  let actionResult = null;

  cp.create = function() {
    modalView = cp.view('.container')
        .hide();
    handleActionResult();

    btnAddPage = cp.field('add-page');
    btnEditPage = cp.field('edit-page');
    btnDeletePage = cp.field('delete-page');
    btnAddComponent = cp.field('add-component');
    brnRebuildAll = cp.field('rebuild-all');

    zuix.context('add-page-dialog', function(addPageDialog) {
      btnAddPage.on('click', function(e, $el) {
        addPageDialog.open(editMode.data, $el);
      });
    });

    zuix.context('delete-page-dialog', function(deletePageDialog) {
      btnDeletePage.on('click', function(e, $el) {
        deletePageDialog.open(editMode.data, $el);
      });
    });

    zuix.context('create-component-dialog', function(createComponentDialog) {
      btnAddComponent.on('click', function(e, $el) {
        createComponentDialog.open(editMode.data, $el);
      });
    });

    btnEditPage.on('click', function() {
      const data = editMode.data;
      if (editMode && data.host && data.page.url) {
        const editUrl = '/editor/#' + data.page.url;
        data.host.location.replace(editUrl);
        return;
      }
      const editUrl = '/editor/#' + data.page.url;
      let isEditorOpen = false;
      try {
        isEditorOpen = parent.location.pathname === '/editor/';
      } catch (e) { }
      if (isEditorOpen) { // || top !== window) {
        parent.location.replace(editUrl);
      } else {
        document.location.replace(editUrl);
      }
    });
    brnRebuildAll.on('click', function() {
      if (_browserSync) {
        showWaitingSpinner();
        showModal();
        _browserSync.socket.emit('zuix:buildAll');
      }
    });

    _browserSync.socket.on('zuix:build:done', function() {
      _browserSync.socket.disconnect();
      cp.trigger('zuix:action:result', actionResult);
      actionResult = null;
      hideModal();
    });

    cp.expose({
      mode: function(m) {
        if (m) {
          editMode = m;
          editMode.editPage ? btnEditPage.show() : btnEditPage.hide();
          editMode.deletePage ? btnDeletePage.show() : btnDeletePage.hide();
          editMode.addPage ? btnAddPage.show() : btnAddPage.hide();
          editMode.addComponent ? btnAddComponent.show() : btnAddComponent.hide();
          editMode.rebuildAll ? brnRebuildAll.show() : brnRebuildAll.hide();
          if (editMode.hidden) {
            cp.view().hide();
          } else {
            cp.view().show();
          }
          return cp.context;
        } else {
          return editMode;
        }
      },
      dialogBehavior: {
        'open': function(e, $opener) {
          const p = $opener.position();
          this.css({
            'transform-origin': p.x + (p.rect.width/2) + 'px ' + (p.y + (p.rect.height/2)) + 'px'
          }).playTransition('zoomOut zoomIn').show();
          showModal();
        },
        'close': function() {
          this.playTransition('zoomIn zoomOut');
          hideModal();
        },
        'cancel': function() {
          this.trigger('close');
        },
        'waiting': function() {
          showWaitingSpinner();
        },
        'error': function() {
          hideWaitingSpinner();
        },
        'success': function(e, ar) {
          this.hide();
          actionResult = ar;
          cp.trigger('zuix:action:progress', actionResult);
        },
        'keydown': function(e) {
          if (e.key === 'Escape') {
            this.trigger('close');
          }
        }
      }
    });

    // Hide main application menu's button when opening zuix-editor menu
    zuix.context('menu-overlay', (appMenu) => {
      if (!appMenu) return;
      cp.field('menu').on({
        'open': function() {
          appMenu.hideButton();
        },
        'close': function() {
          appMenu.showButton();
        }
      });
    });

    // TODO: not sure why "modelToView()" method goes async
    setTimeout(function() {
      cp.view('.menu-item div:not(.menu-item-disabled)').on({
        'mouseover': function(evt, $el) {
          $el.children().addClass('accent');
        },
        'mouseout': function(evt, $el) {
          $el.children().removeClass('accent');
        }
      });
      // home page cannot be deleted, hide the item
      if (document.location.pathname === '/') {
        cp.field('delete-page').parent().addClass('hidden');
      }
    }, 500);

    addTransitions();
  };

  function showModal() {
    modalView
        .playTransition('fadeOut fadeIn').show();
  }
  function hideModal() {
    modalView
        .playTransition({
          classes: 'fadeIn fadeOut',
          onEnd: function() {
            this.hide();
            this.children().hide();
          }
        });
    hideWaitingSpinner();
  }
  function showWaitingSpinner() {
    modalView
        .addClass('waitingOperation');
  }
  function hideWaitingSpinner() {
    modalView
        .removeClass('waitingOperation');
  }

  function handleActionResult() {
    if (document.location.hash.indexOf('#reload(') === 0) {
      document.location.href = document.location.hash
          .substring(8, document.location.hash.length - 1);
    } else if (document.location.hash === '#waitReload') {
      showModal();
      showWaitingSpinner();
      document.location.hash = '';
      return;
    }
    // read result from previous action (if any)
    let actionResult = localStorage.getItem('result');
    if (actionResult) {
      localStorage.removeItem('result');
      actionResult = JSON.parse(actionResult);
      if (actionResult.action === 'addComponent') {
        zuix.context('create-component-dialog', function(createComponentDialog) {
          hideWaitingSpinner();
          showModal();
          createComponentDialog.showResult(actionResult.data);
        });
      }
    }
  }

  function addTransitions() {
    const commonOptions = {
      duration: '0.2s',
      timingFunction: 'ease-in-out'
    };
    cp.addTransition( 'fadeIn', {
      opacity: '1'
    }, commonOptions);
    cp.addTransition( 'fadeOut', {
      opacity: '0'
    }, commonOptions);
    commonOptions.duration = '0.3s';
    cp.addTransition('zoomIn', {
      transform: 'scale(1)'
    }, commonOptions);
    cp.addTransition('zoomOut', {
      transform: 'scale(0)'
    }, commonOptions);
  }
}
module.exports = zuixEditor;
