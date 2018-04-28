(function() {
	/**
	 * Obtains parameters from the hash of the URL
	 * @return Object
	 */
	function getHashParams() {
		var hashParams = {};
		var e, r = /([^&;=]+)=?([^&;]*)/g,
			q = window.location.hash.substring(1);
		while ( e = r.exec(q)) {
			hashParams[e[1]] = decodeURIComponent(e[2]);
		}
		return hashParams;
	}

	function getCoords(elem) {
		var box = elem.getBoundingClientRect();
		var body = document.body;
		var docEl = document.documentElement;
		var scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;
		var clientLeft = docEl.clientLeft || body.clientLeft || 0;
		var left = box.left + scrollLeft - clientLeft;
		return left;
	}

	function convertMillis(millis) {
		var minutes = Math.floor(millis / 60000);
		var seconds = ((millis % 60000) / 1000).toFixed(0);
		return (seconds == 60 ? (minutes+1) + ":00" : minutes + ":" + (seconds < 10 ? "0" : "") + seconds);
	}

	function setPosition(millis) {
		$.ajax({
			url: 'https://api.spotify.com/v1/me/player/seek?position_ms='+millis,
			type: 'PUT',
			headers: {'Authorization': 'Bearer ' + access_token},
			complete: function(data, xhr, textStatus) {
				console.log(data.status);
				getState();
			}
		});
	}

	function setMenu(menu) {

		$('#spotify-menu .nav-pills .nav-item').removeClass('active');
		$('#spotify-menu .menu').hide();		
		$('#'+menu+'-btn').addClass('active');

		var previousCss  = $("#spotify-queue").attr("style");
		$("#spotify-queue")
			.css({
				visibility: 'hidden',
				display:    'block'
			});
		
		optionHeight = $("#spotify-queue").height();

		$("#spotify-queue").attr("style", previousCss ? previousCss : "");
		$('#spotify-'+menu).show();
		if(menu != "queue")
			$('#spotify-'+menu).css('height', optionHeight );

	}

	function setHighlight() {
		$('#playlist-details .track').removeClass('bg-primary text-white');
		$('#playlist-details .track').each(function() {
			if($(this).data('uri') === $('#track-id').val())
				$(this).addClass('bg-primary text-white');
		});

		$('#playlist-list .playlist').removeClass('active');
		$('#playlist-list .playlist').each(function() {
			if($(this).data('uri') === $('#context-id').val())
				$(this).addClass('active');
		});
	}

	function getArtist(id) {
		$.ajax({
			url: 'https://api.spotify.com/v1/artists/'+id,
			type: 'GET',
			headers: {'Authorization': 'Bearer ' + access_token},
			complete: function(data, xhr, textStatus) {
				data = data.responseJSON;
				console.log(data);
				var html_result = '<div id="artist-detail">';

				html_result += '<h3 class="text-center text-muted mt-2">'+data.name+'</h3>';
				
				html_result += '<div class="text-center text-capitalize mt-2 mb-2">';
				
				data.genres.forEach(function(genre) {
					html_result += '<span class="badge badge-pill badge-primary mr-1">'+genre+'</span>';
				});
				html_result += '</div>';
				
				html_result += '</div>';
				$('#spotify-browse').html('').append(html_result);
				setMenu('browse');
				setHighlight();
				getTopTracksArtist(id);
			}
		});
	}

	function getTopTracksArtist(id) {
		$.ajax({
			url: 'https://api.spotify.com/v1/artists/'+id+'/top-tracks?country=FR',
			type: 'GET',
			headers: {'Authorization': 'Bearer ' + access_token},			
			complete: function(data, xhr, textStatus) {
				data = data.responseJSON;
				console.log(data);
				var html_result = '<div id="top-track">';
				
				html_result += '<h5 class="text-muted">Popular</h5>';
				
				html_result += '<table class="table table-hover small no-margin mt-2">';
				
				data.tracks.forEach(function(song, index) {
					html_result += '<tr class="track" data-uri="'+song.uri+'">';

					html_result += '<td class="text-muted small-td">'+parseInt(parseInt(index)+1)+'</td>';
					
					html_result += '<td class="small-td"><i class="fa fa-play pointer start-playlist" data-offset="'+index+'"></i></td>';
					song.explicit ? explicit = '<span class="badge badge-light pull-right font-weight-normal">Explicit</span>' : explicit = '';
					
					html_result += '<td>'+song.name+explicit+'</td>';
					
					html_result += '</tr>';
				});

				html_result += '</table>';
				
				html_result += '</div>';
				$('#spotify-browse').append(html_result);
				//$('#spotify-browse').html('').append(html_result);

			}
		});
	}


	function loadArtist() {
		$('.artist').click(function() {
			getArtist($(this).data('id'));
		});
	}


	function getPlaylist(page) {
		var offset = (page-1) * 20;
		$.ajax({
			url: 'https://api.spotify.com/v1/me/playlists?offset='+offset,
			type: 'GET',
			headers: {'Authorization': 'Bearer ' + access_token},
			complete: function(data, xhr, textStatus) {
				data = data.responseJSON;
				console.log(data.items);
				var html_result = '<div id="playlist-list" class="list-group">';
				data.items.forEach(function(playlist) {
					console.log(playlist.name);
					html_result += '<button type="button" class="playlist list-group-item list-group-item-action d-flex justify-content-between align-items-center" data-uri="'+playlist.uri+'" data-user="'+playlist.owner.id+'" data-id="'+playlist.id+'">'+playlist.name+'<span class="badge badge-primary badge-pill">'+playlist.tracks.total+'</span></button>';
				});
				html_result += '</div>'
				$('#spotify-playlist').html(html_result);
				setMenu('playlist');
				setHighlight();
				$('#playlist-list .playlist').click(function() {
					showPlaylist($(this).data('user'), $(this).data('id'));
				});
			}
		});
	}

	function showPlaylist(user, id) {
		$.ajax({
			url: 'https://api.spotify.com/v1/users/'+user+'/playlists/'+id,
			type: 'GET',
			headers: {'Authorization': 'Bearer ' + access_token},
			complete: function(data, xhr, textStatus) {
				data = data.responseJSON;
				console.log(data);
				var html_result = '<table id="playlist-details" class="table table-hover small no-margin"><thead class="thead-light"><tr><th></th><th>Title</th><th>Artist</th></tr></thead><tbody>';
				data.tracks.items.forEach(function(song, index) {
					html_result += '<tr class="track" data-uri="'+song.track.uri+'">';

					html_result += '<td><i class="fa fa-play pointer start-playlist" data-offset="'+index+'"></i></td>';
					song.track.explicit ? explicit = '<span class="badge badge-light pull-right font-weight-normal">Explicit</span>' : explicit = '';
					
					html_result += '<td>'+song.track.name+explicit+'</td>';
					html_result += '<td>'+song.track.artists.map(a => '<span class="artist link" data-id="'+a.id+'" data-uri="'+a.uri+'"  data-name="'+a.name+'">'+a.name+'</span>').join(', ')+'</td>';
					
					html_result += '</tr>';
				});
				html_result += '</tbody></table>'
				$('#spotify-playlist').html(html_result);
				setMenu('playlist');
				setHighlight();
				loadArtist();
				$('#playlist-details .start-playlist').click(function() {
					setTrack(data.uri, $(this).data('offset'));
				});
			}
		});
	}

	function setTrack(uri, offset) {
		$.ajax({
			url: 'https://api.spotify.com/v1/me/player/play',
			type: 'PUT',
			data: JSON.stringify({ "context_uri": uri, "offset": { "position": offset } }),
			headers: {'Authorization': 'Bearer ' + access_token},
			complete: function(data, xhr, textStatus) {
				console.log(data.status);
				getState();
			}
		});    
	}

	function showRepeatMode(mode) {
		$('#repeat-mode').attr("data-state", mode);
		switch(mode) {
			case 'off':
				$('#repeat-mode').removeClass("on");
				$('#repeat-mode .un').css('visibility', 'hidden');
				break;
			case 'context':
				$('#repeat-mode').addClass("on");
				$('#repeat-mode .un').css('visibility', 'hidden');
				break;
			case 'track':
				$('#repeat-mode').addClass("on");
				$('#repeat-mode .un').css('visibility', 'visible');
				break;
		}
	}


	function setRepeatMode() {
		var mode = $('#repeat-mode').attr("data-state");
		var next_mode = '';
		switch(mode) {
			case 'off':
			next_mode = 'context';
			break;
			case 'context':
			next_mode = 'track';
			break;
			case 'track':
			next_mode = 'off';
			break;
		}
		$.ajax({
			url: 'https://api.spotify.com/v1/me/player/repeat?state='+next_mode,
			type: 'PUT',
			headers: {'Authorization': 'Bearer ' + access_token},
			complete: function(data, xhr, textStatus) {
				console.log(data.status);
				showRepeatMode(next_mode)
			}
		});
	}

	function setVolume(percent) {
		if(parseInt(percent) >= 0 && parseInt(percent) <= 100) {
			$.ajax({
				url: 'https://api.spotify.com/v1/me/player/volume?volume_percent='+percent,
				type: 'PUT',
				headers: {'Authorization': 'Bearer ' + access_token},
				complete: function(data, xhr, textStatus) {
					console.log(data.status);
					getState();
				}
			});
		}
	}

	var timerProgresseBar;

	function setTimerSlider(){
		return setInterval(startSlider, 1000);;
	}

	function startSlider() {
		var progress_ms = parseInt($('#progression').attr('data-mili'))+1000;
		var duration_ms = parseInt($('#duree').attr('data-mili'));
		var percent = (progress_ms/duration_ms*100);
		$('#progression').attr('data-mili', progress_ms);
		if(parseInt(percent) < 100) {
			$('#progression').text(convertMillis(progress_ms));
			updateProgress($('#progress-bar'), percent.toFixed(2));
		}
		else
			getState();
	}


	document.getElementById('progress-bar-container').addEventListener('click', function (e) {
		var x = (e.clientX-getCoords(this))/this.clientWidth;
		setPosition(parseInt(x*parseInt($('#duree').attr('data-mili'))));
	});

	document.getElementById('volume-bar-container').addEventListener('click', function (e) {
		var x = (e.clientX-getCoords(this))/this.clientWidth;
		setVolume(parseInt(x*100));
	});

	function updateProgress(obj, percent) {
		obj.css('width', percent+'%');
	}

	var params = getHashParams();

	var access_token = params.access_token,
		refresh_token = params.refresh_token,
		error = params.error;


	function getState() {
		setTimeout(
			function () {
			$.ajax({
                url: 'https://api.spotify.com/v1/me/player/',
                type: 'GET',
				headers: {'Authorization': 'Bearer ' + access_token},
				complete: function(data, xhr, textStatus) {
                    console.log(data.status);

					console.log(data.responseJSON);
					data = data.responseJSON;
					if(data) {
						$('#context-id').val(data.context.uri);
						$('#track-id').val(data.item.uri);
						
						$('.card-img-top').attr('src', data.item.album.images[0].url);
						$('#track').text(data.item.name);
						$('#artiste').html(data.item.artists.map(a => '<span class="artist link" data-id="'+a.id+'" data-uri="'+a.uri+'" data-name="'+a.name+'">'+a.name+'</span>').join(', '));

						data.shuffle_state === true ? $('#shuffle').addClass('on') : $('#shuffle').removeClass('on');

						data.is_playing === false ? $('#play').removeClass('fa-pause-circle-o').addClass('fa-play-circle-o') : $('#play').removeClass('fa-play-circle-o').addClass('fa-pause-circle-o');

						clearInterval(timerProgresseBar);
						if(data.is_playing === true)
							timerProgresseBar = setTimerSlider();

						$('#progression').text(convertMillis(data.progress_ms)).attr('data-mili', data.progress_ms);
						$('#duree').text(convertMillis(data.item.duration_ms)).attr('data-mili', data.item.duration_ms);

						updateProgress($('#progress-bar'), (data.progress_ms/data.item.duration_ms*100).toFixed(2));

						$('#volume').css('width', data.device.volume_percent+'%');

						showRepeatMode(data.repeat_state);

						switch(data.device.type) {
						case 'GameConsole':
							ico = 'gamepad';
							break;
						case 'Computer':
							ico = 'laptop';
							break;
						default:
							ico = 'mobile-phone';
							break
						}
						$('#device').html('<i class="fa fa-'+ico+'"></i> '+data.device.name);

						setHighlight();
						loadArtist()
					}
				}
			});
		}, 310);
	}

	if (error) {
		alert('There was an error during the authentication');
	} else {
		if (access_token) {
			$.ajax({
				url: 'https://api.spotify.com/v1/me',
				headers: {'Authorization': 'Bearer ' + access_token},

				complete: function(data, xhr, textStatus) {
					console.log(data.status);
					if(data.status == 401)
						$('#spotify-login').show();
					else {
						$('#spotify-login').hide();
						timerRefreshToken = setRefreshToken();
						getState();
					}
				}
			});
		} else {
			$('#spotify-login').show();
		}

		document.getElementById('play').addEventListener('click', function() {
			getState()
			$('#play').hasClass('fa-play-circle-o') ? endpoint = 'play' : endpoint = 'pause';

			$.ajax({
				url: 'https://api.spotify.com/v1/me/player/'+endpoint,
				type: 'PUT',
				headers: {'Authorization': 'Bearer ' + access_token},
				complete: function(data, xhr, textStatus) {
					console.log(data.status);
					getState();
				}
			});          
		}, false);

		document.getElementById('next').addEventListener('click', function() {
			$.ajax({
				url: 'https://api.spotify.com/v1/me/player/next',
				type: 'POST',
				headers: {'Authorization': 'Bearer ' + access_token},
				complete: function(data, xhr, textStatus) {
					console.log(data.status);
					getState();
				}
			});
		}, false);

		document.getElementById('previous').addEventListener('click', function() {
			$.ajax({
				url: 'https://api.spotify.com/v1/me/player/previous',
				type: 'POST',
				headers: {'Authorization': 'Bearer ' + access_token},
				complete: function(data, xhr, textStatus) {
					console.log(data.status);
					getState();
				}
			});
		}, false);

		document.getElementById('mute').addEventListener('click', function() {
			setVolume(0);
		}, false);

		document.getElementById('volume-max').addEventListener('click', function() {
			setVolume(100);
		}, false);

		document.getElementById('repeat-mode').addEventListener('click', function() {
			setRepeatMode();
		}, false);

		document.getElementById('playlist-btn').addEventListener('click', function() {
			getPlaylist(1);
		}, false);

		document.getElementById('queue-btn').addEventListener('click', function() {
			setMenu('queue');
		}, false);

		document.getElementById('browse-btn').addEventListener('click', function() {
			setMenu('browse');
		}, false);

		document.getElementById('search-btn').addEventListener('click', function() {
			setMenu('search');
		}, false);

		document.getElementById('shuffle').addEventListener('click', function() {
			var state;
			$('#shuffle').hasClass('on') ? state = false : state = true;
			$.ajax({
				url: 'https://api.spotify.com/v1/me/player/shuffle?state='+state,
				type: 'PUT',
				headers: {'Authorization': 'Bearer ' + access_token},
				complete: function(data, xhr, textStatus) {
					console.log(data.status);
					getState();
				}
			});
		}, false);

		var timerRefreshToken;
		
		function setRefreshToken(){
			return setInterval(refreshToken, 30000);;
		}
		
		function refreshToken() {
			$.ajax({
				url: '/spotify/refresh_token',
				data: {
				'refresh_token': refresh_token
				}
			}).done(function(data) {
				access_token = data.access_token;
				//console.log(access_token);
			});
		}
	}
})();
