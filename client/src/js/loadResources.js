export function loadResources() {
  [
    'ext/resources/css/ext-all.css',
    'ext/resources/css/xtheme-gray.css',
    'css/stigman.css',
    'css/font-awesome.min.css',
    'ext/ux/fileuploadfield/css/fileuploadfield.css',
    'css/RowEditor.css',
    'css/jsonview.bundle.css',
    'css/diff2html.min.css',
    'css/dark-mode.css'
  ].forEach(function (href) {
    var link = document.createElement('link');
    link.href = href;
    link.type = "text/css";
    link.rel = "stylesheet";
    link.async = false;
    if (href === 'css/dark-mode.css') {
      link.disabled = (localStorage.getItem('darkMode') !== '1')
    }
    document.head.appendChild(link);
  });

  [
    'ext/adapter/ext/ext-base-debug.js',
    'ext/ext-all-debug-w-comments.js',
    "ext/ux/GroupSummary.js",
    "js/chart.min.js",
    "js/diff.js",
    "js/diff2html.min.js",
    "js/stigmanUtils.js",
    'js/SM/Global.js',
    'js/BufferView.js',
    'js/SM/EventDispatcher.js',
    'js/SM/Cache.js',
    'js/SM/ServiceWorker.js',
    'js/SM/State.js',
    'js/SM/TipContent.js',
    'js/SM/Ajax.js',
    'js/SM/Warnings.js',
    'js/SM/Classification.js',
    'js/SM/MainPanel.js',
    "js/SM/WhatsNew.js",
    "js/FileUploadField.js",
    "js/MessageBox.js",
    "js/overrides.js",
    "js/RowEditor.js",
    "js/RowExpander.js",
    "js/SM/SelectingGridToolbar.js",
    "js/SM/NavTree.js",
    "js/SM/RowEditorToolbar.js",
    "js/SM/BatchReview.js",
    "js/SM/Collection.js",
    "js/SM/CollectionStig.js",
    "js/SM/CollectionForm.js",
    "js/SM/CollectionAsset.js",
    "js/SM/CollectionGrant.js",
    "js/SM/CollectionPanel.js",
    "js/SM/ColumnFilters.js",
    "js/SM/FindingsPanel.js",
    "js/SM/Assignments.js",
    "js/SM/asmcrypto.all.es5.js",
    "js/SM/Attachments.js",
    "js/SM/Exports.js",
    "js/SM/Parsers.js",
    "js/SM/Review.js",
    "js/SM/ReviewsImport.js",
    "js/SM/TransferAssets.js",
    "js/SM/Library.js",
    "js/SM/StigRevision.js",
    "js/library.js",
    "js/userAdmin.js",
    "js/collectionAdmin.js",
    "js/collectionManager.js",
    "js/stigAdmin.js",
    "js/appDataAdmin.js",
    "js/completionStatus.js",
    "js/findingsSummary.js",
    "js/review.js",
    "js/collectionReview.js",
    "js/ExportButton.js",
    "js/jszip.min.js",
    "js/FileSaver.js",
    "js/fast-xml-parser.min.js",
    "js/jsonview.bundle.js",
    "js/stigman.js"
  ].forEach(function (src) {
    var script = document.createElement('script');
    script.src = src;
    script.async = false;
    document.head.appendChild(script);
  });
}
