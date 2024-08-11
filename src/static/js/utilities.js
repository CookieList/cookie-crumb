(function ($) {
  $.state = {};
})(jQuery);

(function ($) {
  $.id = function (id) {
      return $("#" + $.escapeSelector(id));
  };
})(jQuery);

(function ($) {
  $.attribute = function (attribute, value) {
      if (value) {
          return $("[" + attribute + "='" + value + "']");
      }
      return $("[" + attribute + "]");
  };
})(jQuery);

(function ($) {
  $.fn.textWidth = function (text, font) {
      if (!$.fn.textWidth.fakeEl) $.fn.textWidth.fakeEl = $('<span class="z-[1]">').hide().appendTo(document.body);
      $.fn.textWidth.fakeEl.text(text || this.val() || this.text()).css("font", font || this.css("font"));
      return $.fn.textWidth.fakeEl.width();
  };
})(jQuery);

function detectSwipeDircetion(el, callback) {
  var touchsurface = el,
      swipedir,
      startX,
      startY,
      distX,
      distY,
      threshold = 130,
      restraint = 100,
      allowedTime = 300,
      elapsedTime,
      startTime,
      handleswipe = callback || function (swipedir) {};

  touchsurface.addEventListener(
      "touchstart",
      function (e) {
          var touchobj = e.changedTouches[0];
          swipedir = "none";
          dist = 0;
          startX = touchobj.pageX;
          startY = touchobj.pageY;
          startTime = new Date().getTime();
      },
      false,
  );

  touchsurface.addEventListener(
      "touchend",
      function (e) {
          var touchobj = e.changedTouches[0];
          distX = touchobj.pageX - startX;
          distY = touchobj.pageY - startY;
          elapsedTime = new Date().getTime() - startTime;
          if (elapsedTime <= allowedTime) {
              if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint) {
                  swipedir = distX < 0 ? "left" : "right";
              } else if (Math.abs(distY) >= threshold && Math.abs(distX) <= restraint) {
                  swipedir = distY < 0 ? "up" : "down";
              }
          }
          handleswipe(swipedir);
      },
      false,
  );
}

$.state.months_name = {
  0: "Jan",
  1: "Feb",
  2: "Mar",
  3: "Apr",
  4: "May",
  5: "Jun",
  6: "Jul",
  7: "Aug",
  8: "Sep",
  9: "Oct",
  10: "Nov",
  11: "Dec",
};

$.state.graphql = `
query ($username: String, $userid: Int) {
    ANIME: MediaListCollection(userId: $userid, userName: $username, type: ANIME, status_in: [CURRENT, REPEATING], forceSingleCompletedList: true) {
        ...media
    }
    MANGA: MediaListCollection(userId: $userid, userName: $username, type: MANGA, status_in: [CURRENT, REPEATING], forceSingleCompletedList: true) {
        ...media
    }
    USER: User(id: $userid, name: $username) {
        id
        name
        avatar {
            large
        }
        siteUrl
    }
}

fragment media on MediaListCollection {
    lists {
        isCustomList
        entries {
            media {
                id
                title {
                    english
                    native
                    romaji
                }
                status(version: 2)
                type
                format
                episodes
                duration
                isFavourite
                chapters
                episodes
                coverImage {
                    large
                }
                nextAiringEpisode {
                    airingAt
                    episode
                }
                mediaListEntry {
                    progress
                    progressVolumes
                    status
                    repeat
                    score(format: POINT_100)
                }
                siteUrl
            }
        }
    }
}

`;

$.state.status_window_graphql = `
mutation ($mediaid: Int, $status: MediaListStatus, $score: Int, $repeat: Int, $progress: Int, $volumes: Int) {
    SaveMediaListEntry(mediaId: $mediaid, status: $status, scoreRaw: $score, repeat: $repeat, progress: $progress, progressVolumes: $volumes) {
        mediaId
        status
        progress
        repeat
        score(format: POINT_100)
        progressVolumes
        media {
            duration
        }
    }
}

`;

$.state.status_window_graphql_with_like_toggle = `
mutation ($mediaid_anime: Int, $mediaid_manga: Int, $mediaid: Int, $status: MediaListStatus, $score: Int, $repeat: Int, $progress: Int, $volumes: Int) {
    SaveMediaListEntry(mediaId: $mediaid, status: $status, scoreRaw: $score, repeat: $repeat, progress: $progress, progressVolumes: $volumes) {
        mediaId
        status
        progress
        repeat
        score(format: POINT_100)
        progressVolumes
        media {
            duration
        }
    }
    ToggleFavourite(animeId: $mediaid_anime, mangaId: $mediaid_manga) {
        anime {
            pageInfo {
                currentPage
            }
        }
        manga {
            pageInfo {
                currentPage
            }
        }
    }
}

`;

$.state.increment_graphql = `
mutation ($mediaid: Int, $progress: Int) {
    SaveMediaListEntry(mediaId: $mediaid, progress: $progress) {
        progress
        media {
            duration
        }
    }
}

`;

$.state.query_user_graphql = `
{
    Viewer {
        id
        name
        avatar {
            medium
        }
        siteUrl
    }
}

`;

$.state.media_lists_graphql = `
query ($userid: Int, $mediatype: MediaType) {
    chunk_1: MediaListCollection(userId: $userid, type: $mediatype, forceSingleCompletedList: true, perChunk: 500, chunk: 1) {
        ...collection
    }
    chunk_2: MediaListCollection(userId: $userid, type: $mediatype, forceSingleCompletedList: true, perChunk: 500, chunk: 2) {
        ...collection
    }
    chunk_3: MediaListCollection(userId: $userid, type: $mediatype, forceSingleCompletedList: true, perChunk: 500, chunk: 3) {
        ...collection
    }
    chunk_4: MediaListCollection(userId: $userid, type: $mediatype, forceSingleCompletedList: true, perChunk: 500, chunk: 4) {
        ...collection
    }
    chunk_5: MediaListCollection(userId: $userid, type: $mediatype, forceSingleCompletedList: true, perChunk: 500, chunk: 5) {
        ...collection
    }
    chunk_6: MediaListCollection(userId: $userid, type: $mediatype, forceSingleCompletedList: true, perChunk: 500, chunk: 6) {
        ...collection
    }
}

fragment collection on MediaListCollection {
    lists {
        isCustomList
        status
        entries {
            media {
                id
                title {
                    userPreferred
                }
                type
                format
                coverImage {
                    medium
                    large
                }
                siteUrl
            }
        }
    }
}

`;
