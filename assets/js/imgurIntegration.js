(function ($) {

	var imgurIntegration = {
		imgurAlbumHash: 'Y9PKtpI',
		imgurAuthorization: 'Client-ID 79ea70333c45883',
		fallbackCdnUrl: 'https://pdxbiketag.s3-us-west-2.amazonaws.com/biketag/',
		imgurAccessToken: null,
		imgurAlbumPictures: null,
		imgurAlbumPicturesRefreshFrequency: 60000,
		imgurPostComponent: 'ImgurPost',
		adminEmailAddresses: [
			"keneucker@gmail.com",
			"pdxbiketag@gmail.com",
			"biketagorg@gmail.com",
			"evanwhite.is@gmail.com"
		],

		createAlbum: function (ids) {

			var url = 'https://api.imgur.com/3/album/';

			var formData = new FormData();
			formData.append("ids", ids);

			$.ajax({
				crossDomain: true,
				processData: false,
				contentType: false,
				url: url,
				data: formData,
				type: 'POST',
				headers: {
					Authorization: this.imgurAuthorization,
					Accept: 'application/json'
				},
				mimeType: 'multipart/form-data'
			}).done(function (response) {
				debugger;
				console.log(response);
			});

		},

		getCurrentTagInformation() {
			var tagInformation = {
				currentTagNumber: 0,
				hasTag: false,
				currentTag: null,
			};

			if (this.imgurAlbumPictures.length) {
				tagInformation.currentTag = this.imgurAlbumPictures[0];

				if (tagInformation.currentTag) {
					tagInformation.hasTag = true;
					tagInformation.currentTagNumber = Number(tagInformation.currentTag.description.split(' ')[0].substr(1));
				}
			}

			tagInformation.nextTagNumber = tagInformation.currentTagNumber + 1;

			return tagInformation;
		},

		getImgurAlbumInfo: function (albumHash, callback) {
			if (!albumHash) {
				albumHash = this.imgurAlbumHash;
			}
			$.ajax({
				url: 'https://api.imgur.com/3/album/' + albumHash + '',
				success: function (data) {
					console.log(data);

					if (callback) {
						callback(data);
					}
				},
				error: function (err) {
					console.log('error getting images from imgur', err);
				},
				beforeSend: function (xhr) {
					xhr.setRequestHeader("Authorization", this.imgurAuthorization);
				}.bind(this),
			});
		},

		refreshImgurAlbumInfo: function (albumInfo) {
			if (albumInfo && albumInfo.data) {
				albumInfo = albumInfo.data;
			} else {
				return;
			}

			if (albumInfo.images_count != window.imgurIntegration.imgurAlbumPictures.length) {
				console.log('image count has changed, updating most recent tags');
				this.imgurAlbumPictures = this.getImgurAlbumImagesByUploadDate(albumInfo.images);
				this.showLatestTagImages();
			}
		},

		getImgurAlbumImagesByUploadDate: function (images, newestFirst) {
			if (!newestFirst) {
				return images.sort(function (image1, image2) {
					return new Date(image2.datetime) - new Date(image1.datetime);
				});
			} else {
				return images.sort(function (image1, image2) {
					return new Date(image1.datetime) - new Date(image2.datetime);
				});
			}
		},

		getImgurAlbumPictures: function (albumHash, callback) {
			if (!albumHash) {
				albumHash = this.imgurAlbumHash;
			}
			$.ajax({
				url: 'https://api.imgur.com/3/album/' + albumHash + '/images',
				success: function (data) {
					// console.log(data);
					this.imgurAlbumPictures = this.getImgurAlbumImagesByUploadDate(data.data);

					if (callback) {
						callback(data);
					}
				}.bind(this),
				error: function (err) {
					console.log('error getting images from imgur', err);
				},
				beforeSend: function (xhr) {
					xhr.setRequestHeader("Authorization", this.imgurAuthorization);
				}.bind(this),
			});
		},

		biketagImageTemplate: function (image, title) {
			var imageLinkStringSplit = image.link.split('.')
			var imageLinkStringEnd = '.' + imageLinkStringSplit[imageLinkStringSplit.length - 1]
			var thumbnail = image.link.replace(imageLinkStringEnd, 'l' + imageLinkStringEnd)
			var tagNumber = '';

			if (image.gifv) {
				thumbnail = image.link;
			}

			if (image.description) {
				var split = image.description.split(' ');
				tagNumber = split[0];
				split = image.description.split('by');
				tagCredit = split[split.length - 1];
			}

			// console.log('setting image link', image.link, image);
			return '<h2>' + title + '</h2>\
                    <a href="' + image.link + '" target="_blank">\
                        <span>' + tagNumber + '</span>\
                        <span>' + tagCredit + '</span>\
                        <img data-src="' + thumbnail + '">\
                    </a>';
		},

		renderBikeTag: function (tag, heading, targetSelector) {
			var targetContainer = document.querySelector(targetSelector || '.content .inner');

			if (targetContainer) {
				var tagContainer = document.createElement('div');
				tagContainer.className = "m-imgur-post";
				tagContainer.innerHTML = this.biketagImageTemplate(tag, heading || "Tag");
				tagContainer.querySelector('a').addEventListener('click', function (e) {

					if (window.uglipop) {
						e.preventDefault();
						e.stopPropagation();

						window.uglipop({
							source: 'html',
							content: '<img src="' + this.getAttribute('href') + '"></img>'
						});
					}
				});
				targetContainer.appendChild(tagContainer);
			}
		},

		getTagNumberIndex: function (tagNumber) {
			var images = this.imgurAlbumPictures;
			var tagNumberIndex = ((images.length + 1) - (((tagNumber - (tagNumber % 2) + 1) * 2)));

			var verifyTagNumber = function (index) {
				return index > -1 ? images[index].description.indexOf('#' + tagNumber + ' tag') != -1 : -1
			};
			if (verifyTagNumber(tagNumberIndex)) {
				return tagNumberIndex;
			} else if (tagNumberIndex < (images.length + 1) && verifyTagNumber(tagNumberIndex + 1)) {
				return tagNumberIndex + 1;
			} else if (tagNumberIndex > 0 && verifyTagNumber(tagNumberIndex - 1)) {
				return tagNumberIndex - 1;
			}

			for (var i = 0; i < images.length; ++i) {
				if (verifyTagNumber(i)) {
					tagNumberIndex = i;
				}
			}

			return tagNumberIndex;
		},

		getProofTagNumberIndex: function (tagNumber) {
			var images = this.imgurAlbumPictures;
			var tagNumberIndex = ((images.length + 1) - (((tagNumber - (tagNumber % 2) + 1) * 2)));

			var verifyProofTagNumber = function (index) {
				return images[index].description.indexOf('#' + tagNumber + ' proof') != -1
			};
			if (verifyProofTagNumber(tagNumberIndex)) {
				return tagNumberIndex;
			} else if ((tagNumberIndex + 1 < images.length) && verifyProofTagNumber(tagNumberIndex + 1)) {
				return tagNumberIndex + 1;
			} else if (tagNumberIndex > 0 && verifyProofTagNumber(tagNumberIndex - 1)) {
				return tagNumberIndex - 1;
			}

			for (var i = 0; i < images.length; ++i) {
				console.log(`looking for ${tagNumber} with ${i}`);
				if (verifyProofTagNumber(i)) {
					tagNumberIndex = i;
				}
			}

			return tagNumberIndex;
		},

		showBikeTagNumber: function (tagNumber) {
			if (!this.imgurAlbumPictures) {
				return this.getImgurAlbumPictures(null, this.showBikeTagNumber.bind(this));
			}

			var images = this.imgurAlbumPictures;
			tagNumber = Number.isInteger(tagNumber) ? Number.parseInt(tagNumber) : Number.parseInt(this.getUrlParam('tagnumber')) || 1;
			var imageCount = Math.round((images.length / 2) + ((images.length - 1) % 2));

			if (tagNumber && tagNumber < imageCount) {
				var theTag = images[this.getTagNumberIndex(tagNumber)];
				var proofTag = images[this.getProofTagNumberIndex(tagNumber)];

				if (proofTag) {
					this.renderBikeTag(proofTag, "Found It Tag");
				}
				if (theTag) {
					this.renderBikeTag(theTag, "Original Tag");
				}

				window.lazyLoadInstance = new LazyLoad();
			} else if (tagNumber == imageCount) {
				var newTag = images[this.getTagNumberIndex(tagNumber)];

				this.renderBikeTag(newTag, "Current Tag");

				window.lazyLoadInstance = new LazyLoad();
			}
		},

		showLatestTagImages: function (count) {
			if (!this.imgurAlbumPictures) {
				return this.getImgurAlbumPictures(null, this.showLatestTagImages.bind(this));
			}

			var images = this.imgurAlbumPictures;
			count = Number.isInteger(count) ? count : this.getUrlParam('count');

			if ((images && images.length > 1)) {
				$('.content .inner').empty();
				if (!count) {
					var lastImage = images[0];
					var secondToLastImage = images.length > 1 ? images[1] : null;
					var thirdToLastImage = images.length > 2 ? images[2] : null;

					this.renderBikeTag(lastImage, "Current mystery location to find");
					if (secondToLastImage) {
						this.renderBikeTag(secondToLastImage, "Proof image");
					}
					if (thirdToLastImage) {
						this.renderBikeTag(thirdToLastImage, "Previous tag mystery location");
					}
				} else {
					count = count.toUpperCase() == "ALL" ? images.length : Number(count);
					for (var i = 0;
						(i < count) && (i < images.length); ++i) {
						var image = images[i];
						this.renderBikeTag(image, image.description);
					}
				}

				// Set the form with the tag information
				var currentTagInfo = this.getCurrentTagInformation();
				$('#proofHeading').text('Proof for #' + currentTagInfo.currentTagNumber);
				$('#nextTagHeading').text('Next Tag (#' + currentTagInfo.nextTagNumber + ')');
			}
			// DON'T DO THIS RIGHT NOW
			// $('#nextTagHeading').text('Next Tag info (#' + currentTagInfo.nextTagNumber + ')');

			console.log('loading lazy load images');
			window.lazyLoadInstance = new LazyLoad();

			setTimeout(function () {
				// Hide the overlay and show the content
				$('#loader .logo').animate({
					top: "-200px"
				});
				$('#loader').fadeOut();
				$('#main').fadeIn();
			}, 1000);
		},

		// buildBiketagImage: function (target, image, title) {
		// 	if (!$(target).length) {
		// 		// Can't add it to nothing
		// 		return;
		// 	}

		// 	var data = {
		// 		thumbnail: image.link.substr(0, image.link.length - 4) + 'l' + image.link.substr(-4),
		// 		imageLink: image.link,
		// 		tagNumber: '',
		// 		tagCredit: '',
		// 		title: title
		// 	}

		// 	if (image.description) {
		// 		var split = image.description.split(' ');
		// 		data.tagNumber = split[0];
		// 		data.tagCredit = split[split.length - 1];
		// 	}

		// 	data.component = this.imgurPostComponent;

		// 	fetch('/views', {
		// 		method: 'POST',
		// 		headers: {
		// 			'Accept': 'application/json',
		// 			'Content-Type': 'application/json'
		// 		},
		// 		body: JSON.stringify(data),
		// 	}).then(function (res) {
		// 		return res.text();
		// 	}).then(function (response) {
		// 		var container = $(response);
		// 		$(target).append(container.html());
		// 		window.lazyLoadInstance = new LazyLoad();
		// 	}).catch(function (error) {
		// 		console.error('Error:', error)
		// 	});
		// },

		// showBikeTagNumber: function (number) {
		//     if (!this.imgurAlbumPictures) {
		//         return this.getImgurAlbumPictures(null, this.showBikeTagNumber);
		//     }

		//     var images = this.imgurAlbumPictures;
		//     number = Number.isInteger(number) ? Number.parseInt(number) : Number.parseInt(this.getUrlParam('tagnumber'));
		//     var realCount = (images.length / 2) + (images.length % 2);

		//     if (number && number < realCount) {
		//         var realTagNumber = images.length - (number * 2) + 1;
		//         var theTag = images[realTagNumber];
		//         var previousTag = images[realTagNumber + 1];

		//         this.buildBiketagImage('.content .inner', theTag, "Tag #" + number);
		//         if (previousTag) {
		//             this.buildBiketagImage('.content .inner', previousTag, "Proof for tag #" + (number - 1));
		//         }

		//         window.lazyLoadInstance = new LazyLoad();
		//     }
		// },

		// showLatestTagImages: function (count) {
		//     if (!this.imgurAlbumPictures) {
		//         return this.getImgurAlbumPictures(null, this.showLatestTagImages);
		//     }

		//     var images = this.imgurAlbumPictures;
		//     count = Number.isInteger(count) ? count : this.getUrlParam('count');
		//     $('.content .inner').empty();

		//     if (!count) {
		//         var lastImage = images[0];
		//         var secondToLastImage = images.length > 1 ? images[1] : null;
		//         var thirdToLastImage = images.length > 2 ? images[2] : null;

		//         this.buildBiketagImage('.content .inner', lastImage, "Tag You're It!");
		//         if (secondToLastImage) {
		//             this.buildBiketagImage('.content .inner', secondToLastImage, "Proof");
		//         }
		//         if (thirdToLastImage) {
		//             this.buildBiketagImage('.content .inner', thirdToLastImage, "Last tag");
		//         }
		//     } else {
		//         count = count.toUpperCase() == "ALL" ? images.length : Number(count);
		//         for (var i = 0; (i < count) && (i < images.length); ++i) {
		//             var image = images[i];
		//             this.buildBiketagImage('.content .inner', image, image.description);
		//         }
		//     }

		//     // Set the form with the tag information
		//     var currentTagInfo = this.getCurrentTagInformation();
		//     $('#proofHeading').text('Proof for #' + currentTagInfo.currentTagNumber);
		//     // DON'T DO THIS RIGHT NOW
		//     // $('#nextTagHeading').text('Next Tag info (#' + currentTagInfo.nextTagNumber + ')');

		//     window.lazyLoadInstance = new LazyLoad();
		//     console.log('loading lazy load images', window.lazyLoadInstance);
		// },

		uploadImageToImgur: function (image, description, next) {
			// Begin file upload
			console.log("Uploading file to Imgur..");

			var formData = new FormData();
			formData.append("image", image);
			formData.append("album", this.imgurAlbumHash);
			formData.append("description", description);

			var settings = {
				crossDomain: true,
				processData: false,
				contentType: false,
				data: formData,
				type: 'POST',
				url: 'https://api.imgur.com/3/image',
				headers: {
					Authorization: this.imgurAccessToken,
					Accept: 'application/json'
				},
				mimeType: 'multipart/form-data'
			};

			// Response contains stringified JSON
			// Image URL available at response.data.link
			$.ajax(settings).done(function (response) {
				next();
			});
		},

		getImgurTokens: function (done) {
			var self = this;
			fetch('/auth/imgur/getToken', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					}
				}).then(function (res) {
					return res.json()
				})
				.catch(function (error) {
					console.error('Error:', error)
				})
				.then(function (response) {
					const imgurTokens = response.imgurTokens;

					if (imgurTokens && typeof imgurTokens == 'object') {
						self.imgurAlbumHash = imgurTokens.imgurAlbumHash || self.imgurAlbumHash;
						self.imgurAccessToken = imgurTokens.imgurAccessToken ? 'Bearer ' + imgurTokens.imgurAccessToken : self.imgurAccessToken;
						self.imgurAuthorization = imgurTokens.imgurAuthorization ? 'Client-ID ' + imgurTokens.imgurAuthorization : self.imgurAuthorization;
					}

					done(response);
				});
		},

		getUrlParam(param) {
			var searchParams = new URLSearchParams(window.location.search);

			if (!param) {
				return searchParams;
			} else {
				return searchParams.get(param);
			}
		},

		sendNotificationEmail(emailAddress, subject, body) {
			Email.send({
				// Host: "smtp.gmail.com",
				// Username: "biketagorg",
				// Password: "BikeTagOrg720!",
				SecureToken: "1dc9bf22-d96c-46a6-86d7-1a3521d62781",
				To: emailAddress,
				From: "biketagorg@gmail.com",
				Subject: subject,
				Body: body,
				Port: 587,
			}).then(
				message => console.log(message)
			);
		},

		getExif(file) {
			var data = []

			return EXIF.readFromBinaryFile(file)
		},

		getGPSCoordinates(exifdata) {
			function ConvertDMSToDD(degrees, minutes, seconds, direction) {

				var dd = degrees + (minutes / 60) + (seconds / 3600);

				if (direction == "S" || direction == "W") {
					dd = dd * -1;
				}

				return dd;
			}

			// Calculate latitude decimal
			var latDegree = exifdata.GPSLatitude[0].numerator;
			var latMinute = exifdata.GPSLatitude[1].numerator;
			var latSecond = exifdata.GPSLatitude[2].numerator;
			var latDirection = exifdata.GPSLatitudeRef;

			var latitude = ConvertDMSToDD(latDegree, latMinute, latSecond, latDirection);
			console.log(latitude);

			// Calculate longitude decimal
			var lonDegree = exifdata.GPSLongitude[0].numerator;
			var lonMinute = exifdata.GPSLongitude[1].numerator;
			var lonSecond = exifdata.GPSLongitude[2].numerator;
			var lonDirection = exifdata.GPSLongitudeRef;

			var longitude = ConvertDMSToDD(lonDegree, lonMinute, lonSecond, lonDirection);
			console.log(longitude);

			return {
				latitude,
				longitude,
			}
		},

		showGPSOnMap(latitude, longitude) {
			var map = new google.maps.Map(document.getElementById('map'), {
				center: {
					lat: latitude,
					lng: longitude,
				},
				zoom: 8
			});


			// // Try HTML5 geolocation.
			// if (navigator.geolocation) {
			// 	navigator.geolocation.getCurrentPosition(function (position) {
			// 		var pos = {
			// 			lat: position.coords.latitude,
			// 			lng: position.coords.longitude
			// 		};

			// 		infoWindow.setPosition(pos);
			// 		infoWindow.setContent('Location found.');
			// 		infoWindow.open(map);
			// 		map.setCenter(pos);
			// 	}, function () {
			// 		handleLocationError(true, infoWindow, map.getCenter());
			// 	});
			// } else {
			// 	// Browser doesn't support Geolocation
			// 	handleLocationError(false, infoWindow, map.getCenter());
			// }
		},

		onUploadFormSubmit(theButton) {
			// theButton.replaceWith('<i class="fa fa-spinner fa-spin" style="font-size:24px"></i>');

			var self = this
			var form = $('#uploadForm');
			var fileInputs = form.find('input[type="file"]');
			var files = [],
				user = '',
				proofLocation = '';

			// get the latest tag number
			var currentTagInfo = this.getCurrentTagInformation();
			user = form.find('input[name="name"]').val();
			proofLocation = form.find('input[name="location"]').val();
			hint = form.find('input[name="hint"]').val();

			for (var i = 0; i < fileInputs.length; ++i) {
				var $files = fileInputs[i].files;
				var $input = $(fileInputs[i]);

				if ($files.length) {

					// Reject big files
					if ($files[0].size > $(this).data("max-size") * 1024) {
						console.log("Please select a smaller file");
						return false;
					}


					var reader = new FileReader();
					reader.onload = function () {
						var metadata = self.getExif(this.result)
						if (metadata.GPSLatitude && metadata.GPSLongitude) {
							var gps = self.getGPSCoordinates(metadata)
							self.showGPSOnMap(gps.latitude, gps.longitude)
						}
					}
					reader.readAsArrayBuffer($files[0])

					files.push($files[0]);
				} else {
					console.log('I need both files!');
					return;
				}
			}

			var locationString = proofLocation && proofLocation.length ? ' found at ( ' + proofLocation + ' )' : '';
			var hintString = hint && hint.length ? ' (hint:  ' + hint + ' )' : '';
			var image1Description = '#' + currentTagInfo.currentTagNumber + ' proof' + locationString + ' by ' + user;
			var image2Description = '#' + currentTagInfo.nextTagNumber + ' tag' + hintString + ' by ' + user;

			// console.log(this.getExif())

			// this.uploadImageToImgur(files[0], image1Description, function () {
			// 	this.uploadImageToImgur(files[1], image2Description, function () {

			// 		this.adminEmailAddresses.forEach(function (emailAddress) {
			// 			const subject = "New Bike Tag Post (#" + currentTagInfo.nextTagNumber + ")"
			// 			const body = "Hello BikeTag Admin, A new post has been created!\r\nYou are getting this email because you are listed as an admin on the site (" + window.location + "). Reply to this email to request to be removed from this admin list."
			// 			this.sendNotificationEmail(emailAddress, subject, body)
			// 		}.bind(this))

			// 		window.location.href = window.location.pathname + '?uploadSuccess=true';

			// 	}.bind(this));
			// }.bind(this));
		},

		init: function () {
			var self = this;

			$('#main').hide();

			this.getImgurTokens(function (response) {
				var count = self.getUrlParam('count');
				var tagnumber = self.getUrlParam('tagnumber');

				// If the page was reloaded with an upload success, show the upload successful dialogue in set the refresh frequency to 1s
				if (self.getUrlParam('uploadSuccess') == 'true') {
					var wrapper = document.getElementById('wrapper');
					var notification = document.createElement('div');
					notification.id = 'notification';
					notification.innerHTML = 'Your upload was successful! Please wait a few moments for the internet to catch up to you. <a class="close">[close]</a>';
					wrapper.prepend(notification);

					var close = $('#notification .close');
					close.on('click', function () {
						var notification = document.getElementById("notification");
						notification.style.display = 'none';
					});
					self.imgurAlbumPicturesRefreshFrequency = 5000;
				}

				if (count) {
					self.imgurAlbumPicturesRefreshFrequency = false;
					self.showLatestTagImages(count);
				} else if (tagnumber) {
					self.imgurAlbumPicturesRefreshFrequency = false;
					self.showBikeTagNumber(tagnumber);
				} else {
					self.showLatestTagImages();
				}

				if (self.imgurAlbumPicturesRefreshFrequency) {
					setInterval(function () {
						var logo = $('#header > div')[0];
						logo.style.animation = 'none';
						logo.offsetHeight; /* trigger reflow */
						logo.style.animation = null;

						self.getImgurAlbumInfo(null, self.refreshImgurAlbumInfo);
					}, self.imgurAlbumPicturesRefreshFrequency);
				}

				console.log('imgur integration initialized.');
			});

			$('#header > .logo').click(function () {
				document.getElementById('tagItButton').click();
			});

			$('form #submit').click(function (e) {
				e.preventDefault();
				self.onUploadFormSubmit(e.currentTarget);
			});

			return self;
		}
	};

	window.imgurIntegration = imgurIntegration.init();
})(jQuery);
