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
    'ext/adapter/ext/ext-base.js',
    'ext/ext-all.js',
    'ext/ux/GroupSummary.js',
    "js/stig-manager.min.js"
  ].forEach(function (src) {
    var script = document.createElement('script');
    script.src = src;
    script.async = false;
    document.head.appendChild(script);
  });
}
