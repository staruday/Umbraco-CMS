﻿/**
* @ngdoc service
* @name umbraco.services.imageHelper
* @description A helper object used for parsing image paths
**/
function imageHelper(umbRequestHelper) {
    return {
        /**
         * @ngdoc function
         * @name umbraco.services.imageHelper#getImagePropertyValue
         * @methodOf umbraco.services.imageHelper
         * @function    
         *
         * @description
         * Returns the actual image path associated with the image property if there is one
         * 
         * @param {object} options Options object
         * @param {object} options.imageModel The media object to retrieve the image path from
         */
        getImagePropertyValue: function (options) {
            if (!options && !options.imageModel) {
                throw "The options objet does not contain the required parameters: imageModel";
            }


            //combine all props, TODO: we really need a better way then this
            var props = [];
            if (options.imageModel.properties) {
                props = options.imageModel.properties;
            } else {
                $(options.imageModel.tabs).each(function (i, tab) {
                    props = props.concat(tab.properties);
                });
            }

            var mediaRoot = Umbraco.Sys.ServerVariables.umbracoSettings.mediaPath;
            var imageProp = _.find(props, function (item) {
                if (item.alias === "umbracoFile") {
                    return true;
                }

                //this performs a simple check to see if we have a media file as value
                //it doesnt catch everything, but better then nothing
                if (item.value.indexOf(mediaRoot) === 0) {
                    return true;
                }

                return false;
            });

            if (!imageProp) {
                return "";
            }

            var imageVal;

            //our default images might store one or many images (as csv)
            var split = imageProp.value.split(',');
            var self = this;
            imageVal = _.map(split, function (item) {
                return { file: item, isImage: self.detectIfImageByExtension(item) };
            });

            //for now we'll just return the first image in the collection.
            //TODO: we should enable returning many to be displayed in the picker if the uploader supports many.
            if (imageVal.length && imageVal.length > 0 && imageVal[0].isImage) {
                return imageVal[0].file;
            }

            return "";
        },
        /**
         * @ngdoc function
         * @name umbraco.services.imageHelper#getThumbnail
         * @methodOf umbraco.services.imageHelper
         * @function    
         *
         * @description
         * formats the display model used to display the content to the model used to save the content
         * 
         * @param {object} options Options object
         * @param {object} options.imageModel The media object to retrieve the image path from
         */
        getThumbnail: function (options) {

            if (!options && !options.imageModel) {
                throw "The options objet does not contain the required parameters: imageModel";
            }

            var imagePropVal = this.getImagePropertyValue(options);
            if (imagePropVal !== "") {
                return this.getThumbnailFromPath(imagePropVal);
            }
            return "";
        },

        /**
         * @ngdoc function
         * @name umbraco.services.imageHelper#scaleToMaxSize
         * @methodOf umbraco.services.imageHelper
         * @function    
         *
         * @description
         * Finds the corrct max width and max height, given maximum dimensions and keeping aspect ratios
         * 
         * @param {number} maxSize Maximum width & height
         * @param {number} width Current width
         * @param {number} height Current height
         */
        scaleToMaxSize: function (maxSize, width, height) {
            var retval = { width: width, height: height };

            var maxWidth = maxSize; // Max width for the image
            var maxHeight = maxSize;    // Max height for the image
            var ratio = 0;  // Used for aspect ratio

            // Check if the current width is larger than the max
            if (width > maxWidth) {
                ratio = maxWidth / width;   // get ratio for scaling image

                retval.width = maxWidth;
                retval.height = height * ratio;

                height = height * ratio;    // Reset height to match scaled image
                width = width * ratio;    // Reset width to match scaled image
            }

            // Check if current height is larger than max
            if (height > maxHeight) {
                ratio = maxHeight / height; // get ratio for scaling image

                retval.height = maxHeight;
                retval.width = width * ratio;
                width = width * ratio;    // Reset width to match scaled image
            }

            return retval;
        },

        /**
         * @ngdoc function
         * @name umbraco.services.imageHelper#getThumbnailFromPath
         * @methodOf umbraco.services.imageHelper
         * @function    
         *
         * @description
         * Returns the path to the thumbnail version of a given media library image path
         * 
         * @param {string} imagePath Image path, ex: /media/1234/my-image.jpg
         */
        getThumbnailFromPath: function (imagePath) {
            
            //get the proxy url for big thumbnails (this ensures one is always generated)
            var thumbnailUrl = umbRequestHelper.getApiUrl(
                "imagesApiBaseUrl",
                "GetBigThumbnail",
                [{ originalImagePath: imagePath }]);

            //var ext = imagePath.substr(imagePath.lastIndexOf('.'));
            //return imagePath.substr(0, imagePath.lastIndexOf('.')) + "_big-thumb" + ".jpg";

            return thumbnailUrl;
        },

        /**
         * @ngdoc function
         * @name umbraco.services.imageHelper#detectIfImageByExtension
         * @methodOf umbraco.services.imageHelper
         * @function    
         *
         * @description
         * Returns true/false, indicating if the given path has an allowed image extension
         * 
         * @param {string} imagePath Image path, ex: /media/1234/my-image.jpg
         */
        detectIfImageByExtension: function (imagePath) {
            var lowered = imagePath.toLowerCase();
            var ext = lowered.substr(lowered.lastIndexOf(".") + 1);
            return ("," + Umbraco.Sys.ServerVariables.umbracoSettings.imageFileTypes + ",").indexOf("," + ext + ",") !== -1;
        }
    };
}
angular.module('umbraco.services').factory('imageHelper', imageHelper);