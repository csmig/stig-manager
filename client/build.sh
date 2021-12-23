#!/bin/bash

# Requires NodeJS
# npm install -g uglify-js

SrcDir=src
DistDir=dist

# Create dist if necessary
[ ! -d "$DistDir" ] && mkdir -p "$DistDir"
rm -rf $DistDir/*

# ExtJS
mkdir $DistDir/ext
cp -r $SrcDir/ext/resources $DistDir/ext
cp -r $SrcDir/ext/ux $DistDir/ext

# CSS
cp -r $SrcDir/css $DistDir

# Fonts
cp -r $SrcDir/fonts $DistDir

# Images
cp -r $SrcDir/img $DistDir

# HTML
cp -r $SrcDir/index.html $DistDir

# JS
mkdir $DistDir/js
cp $SrcDir/js/init.js $DistDir/js
cp $SrcDir/js/oidcProvider.js $DistDir/js
cp $SrcDir/js/Env.js.example $DistDir/js
cd $SrcDir
uglifyjs \
'ext/adapter/ext/ext-base.js' \
'ext/ext-all.js' \
'ext/ux/GroupSummary.js' \
'js/SM/Global.js' \
'js/SM/TipContent.js' \
'js/SM/Ajax.js' \
'js/SM/Warnings.js' \
'js/SM/Classification.js' \
'js/SM/MainPanel.js' \
'js/SM/EventDispatcher.js' \
'js/FileUploadField.js' \
'js/MessageBox.js' \
'js/overrides.js' \
'js/RowEditor.js' \
'js/RowExpander.js' \
'js/SM/SelectingGridToolbar.js' \
'js/SM/NavTree.js' \
'js/SM/RowEditorToolbar.js' \
'js/SM/Collection.js' \
'js/SM/CollectionForm.js' \
'js/SM/CollectionAsset.js' \
'js/SM/CollectionStig.js' \
'js/SM/CollectionGrant.js' \
'js/SM/ColumnFilters.js' \
'js/SM/FindingsPanel.js' \
'js/SM/Assignments.js' \
'js/SM/asmcrypto.all.es5.js' \
'js/SM/Attachments.js' \
'js/SM/Exports.js' \
'js/SM/Parsers.js' \
'js/SM/Review.js' \
'js/SM/ReviewsImport.js' \
'js/SM/TransferAssets.js' \
'js/SM/Library.js' \
'js/SM/StigRevision.js' \
'js/library.js' \
'js/stigmanUtils.js' \
'js/userAdmin.js' \
'js/collectionAdmin.js' \
'js/collectionManager.js' \
'js/stigAdmin.js' \
'js/appDataAdmin.js' \
'js/adminTab.js' \
'js/completionStatus.js' \
'js/findingsSummary.js' \
'js/review.js' \
'js/collectionReview.js' \
'js/ExportButton.js' \
'js/jszip.min.js' \
'js/FileSaver.js' \
'js/fast-xml-parser.min.js' \
'js/jsonview.bundle.js' \
'js/stigman.js' > ../$DistDir/js/stig-manager.min.js