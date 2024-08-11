$.state.current_main_content = "watchlist";
$.state.current_schedule_day_active = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][new Date().getDay()];
$.state.current_main_content_type = "anime";

$.state.session_cache_id = "ANILIST_RESPONSE";
$.state.session_anime_list_cache_id = "ANILIST_RESPONSE_ANIME";
$.state.session_manga_list_cache_id = "ANILIST_RESPONSE_MANGA";

var USE_CACHE = false;

nunjucks.configure({ autoescape: true });

function initializeCookieCrumb() {
    var user = localStorage.getItem("ANILIST_USER");
    var hash;
    if (!user) {
        if (window.location.hash) {
            hash = window.location.hash.substring(1);
            hash = hash.split("access_token=")[1];
            hash = hash.split("&token_type")[0];
            hash = hash.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/>/g, "&gt;");
            hash = hash.trim();
        }
        if (hash === "" || hash === null || hash === undefined) {
            setTimeout(() => {
                $.id("[L]-start_up_window").attr("data-require-login", "true");
            }, 300);
        } else {
            $.id("[L]-login-menu-options-confirm").addClass("!duration-[0ms]");
            $.id("[L]-login-menu-options-inputs").addClass("!duration-[0ms]");
            $.id("[L]-login-menu").attr("data-confirm-continue", "true");
            setTimeout(() => {
                $.id("[L]-login-menu").attr("data-confirm-continue", "true");
                apiKeyLogin(hash);
            }, 100);
        }
    } else {
        var user_json = JSON.parse(user);
        $.state.session_token = user_json.token;
        $.state.session_id = user_json.id;
        $.state.session_name = user_json.name;
        $.state.session_avatar = user_json.avatar;
        $.state.session_site_url = user_json.site;
        $.id("[F].avatar").attr("src", $.state.session_avatar);
        $.id("[F]-confirm_logout.image").attr("src", $.state.session_avatar);
        $.id("[F]-confirm_logout.name").html($.state.session_name);
        $.id("[F]-logout_confirm.link").html($.state.session_name);
        $.id("[F]-logout_confirm.link").attr("href", $.state.session_site_url);
        queryAniList();
    }
}

function viewFotterSchedule() {
    $.id("[F]").attr("data-show-schedule", "true");
}

function hideFooterSchedule() {
    $.id("[F]").attr("data-show-schedule", "false");
    $.id("[F].fotter_schedule")[0].scrollTo({ top: 0, behavior: "instant" });
}

function logoutUser() {
    var storage = ["ANILIST_USER", "WATCHLIST_FORMAT", "ANILIST_RESPONSE_MANGA", "ANILIST_RESPONSE_ANIME", "SCHEDULE_FORMAT", "WATCHLIST_TYPE", "LISTS_FORMAT", "ANILIST_RESPONSE", "LAST_MAIN_CONTENT"];
    $.each(storage, (_, item) => {
        var local = localStorage.getItem(item);
        if (local) {
            localStorage.removeItem(item);
        }
    });
    setTimeout(() => {
        window.location.reload();
    }, 200);
}

function hideLogOutWindow() {
    $.id("[F]-logout_confirm").attr("data-is-active", "false");

    $.id("[F]-screen").fadeOut();

}

function showLogOutWindow() {
    $.id("[F]-logout_confirm").attr("data-is-active", "true");

    $.id("[F]-screen").fadeIn();
}

function reFreshCookieCrumb() {
    if (USE_CACHE) {
        localStorage.removeItem($.state.session_cache_id);
        localStorage.removeItem($.state.session_anime_list_cache_id);
        localStorage.removeItem($.state.session_manga_list_cache_id);
    }
    $.id("[L]").attr("data-hide-window", "false");
    resetListsView();
    initializeCookieCrumb();
}

function apiKeyLogin(token = null) {
    var fromHash = true;
    if (token === null) {
        token = $.id("[L]-api_key_login_input").val().trim();
        fromHash = false;
    }
    var button = $.id("[L]-api_key_login_button");

    if (token === "" && !fromHash) {
        $.id("[L]-api_key_login_error").html("API key cant be empty.");
        return;
    }

    if (!fromHash) {
        button.attr("data-is-logging-in", "true");
    }

    $.ajax({
        url: "https://graphql.anilist.co",
        method: "POST",
        timeout: 40000,
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: "Bearer " + token,
        },
        data: JSON.stringify({
            query: $.state.query_user_graphql,
        }),
        error: () => {
            $.id("[L]-api_key_login_error").html("Wrong API Key.");
            if (!fromHash) {
                button.attr("data-is-logging-in", "false");
            }
        },
        success: (response) => {
            $.id("[L]-confirm.image").attr("src", response.data.Viewer.avatar.medium);
            $.id("[L]-confirm.name").html(response.data.Viewer.name);
            $.id("[L]-confirm.continue_text").html(response.data.Viewer.name);
            $.id("[L]-confirm.continue_link").attr("href", response.data.Viewer.siteUrl);

            var continueButton = $.id("[L]-confirm.continue_button");
            continueButton.attr("data-token", token);
            continueButton.attr("data-id", response.data.Viewer.id);
            continueButton.attr("data-name", response.data.Viewer.name);
            continueButton.attr("data-avatar", response.data.Viewer.avatar.medium);
            continueButton.attr("data-site", response.data.Viewer.siteUrl);

            if (!fromHash) {
                button.attr("data-is-logging-in", "false");
                setTimeout(() => {
                    $.id("[L]-login-menu").attr("data-confirm-continue", "true");
                }, 200);
            } else {
                $.id("[L]-start_up_window").attr("data-require-login", "true");
            }
        },
    });
}

function confirmLogin() {
    var continueButton = $.id("[L]-confirm.continue_button");
    $.state.session_token = continueButton.attr("data-token");
    $.state.session_id = continueButton.attr("data-id");
    $.state.session_name = continueButton.attr("data-name");
    $.state.session_avatar = continueButton.attr("data-avatar");
    $.state.session_site_url = continueButton.attr("data-site");
    localStorage.setItem(
        "ANILIST_USER",
        JSON.stringify({
            token: $.state.session_token,
            id: $.state.session_id,
            name: $.state.session_name,
            avatar: $.state.session_avatar,
            site: $.state.session_site_url,
        }),
    );
    $.id("[L]-start_up_window").attr("data-require-login", "false");
    setTimeout(() => {
        initializeCookieCrumb();
    }, 100);
}

function removeWaitingPage() {
    $.id("[L]").attr("data-hide-window", "true");
}

function changeMainContent(content) {
    var active_content = content;
    var not_active_content;

    if (content === "watchlist") {
        not_active_content = ["schedule", "lists"];
    } else if (content === "schedule") {
        not_active_content = ["watchlist", "lists"];
    } else {
        not_active_content = ["schedule", "watchlist"];
    }

    if ($.state.current_main_content === active_content) {
        return;
    }

    $.state.current_main_content = active_content;
    localStorage.setItem("MAIN_CONTENT", active_content);

    $.each(not_active_content, (_, i) => {
        $.id("[H]-" + i)
            .removeClass("text-crumb-bright/90")
            .addClass("text-crumb-bright/30");
        $.id("[H]-" + i + ".text").addClass("hidden");
    });
    $.id("[H]-" + active_content)
        .removeClass("text-crumb-bright/30")
        .addClass("text-crumb-bright/90");
    $.id("[H]-" + active_content + ".text").removeClass("hidden");

    $.id("[M]").attr("data-current-main-content", active_content);

    if (active_content === "watchlist") {
        $.id("[H]-format_toggle").attr("data-active-format", $.id("[M]-watchlist").attr("data-current-watchlist-format"));
    } else if (active_content === "schedule") {
        $.id("[H]-format_toggle").attr("data-active-format", $.id("[M]-schedule").attr("data-current-schedule-format"));
    } else {
        $.id("[H]-format_toggle").attr("data-active-format", $.id("[M]-lists").attr("data-current-lists-format"));
    }
}

detectSwipeDircetion($.id("[M]")[0], function (swipeDirection) {
    var mainContent = $.state.current_main_content;
    var mainContentType = $.state.current_main_content_type;
    var scheduleDay = $.state.current_schedule_day_active;
    var scheduleFormat = $.state.current_schedule_format;
    var listsWindow = $.id("[M]-lists").attr("data-current-lists-section");

    if (mainContent === "watchlist") {
        if (swipeDirection === "right" && mainContentType === "manga") {
            toggleWatchListType("anime");
        } else if (swipeDirection === "left") {
            if (mainContentType === "anime") {
                toggleWatchListType("manga");
            } else if (mainContentType === "manga") {
                changeMainContent("schedule");
            }
        }
    } else if (mainContent === "schedule") {
        if (scheduleFormat === "grids" && swipeDirection === "right") {
            changeMainContent("watchlist");
            return;
        }
        if (scheduleFormat === "grids" && swipeDirection === "left") {
            changeMainContent("lists");
            return;
        }
        if (swipeDirection === "right" && scheduleFormat === "stacked") {
            if (scheduleDay === "monday") {
                changeMainContent("watchlist");
            } else if (scheduleDay === "tuesday") {
                changeScheduleDay("monday");
            } else if (scheduleDay === "wednesday") {
                changeScheduleDay("tuesday");
            } else if (scheduleDay === "thursday") {
                changeScheduleDay("wednesday");
            } else if (scheduleDay === "friday") {
                changeScheduleDay("thursday");
            } else if (scheduleDay === "saturday") {
                changeScheduleDay("friday");
            } else if (scheduleDay === "sunday") {
                changeScheduleDay("saturday");
            }
        } else if (swipeDirection === "left" && scheduleFormat === "stacked") {
            if (scheduleDay === "monday") {
                changeScheduleDay("tuesday");
            } else if (scheduleDay === "tuesday") {
                changeScheduleDay("wednesday");
            } else if (scheduleDay === "wednesday") {
                changeScheduleDay("thursday");
            } else if (scheduleDay === "thursday") {
                changeScheduleDay("friday");
            } else if (scheduleDay === "friday") {
                changeScheduleDay("saturday");
            } else if (scheduleDay === "saturday") {
                changeScheduleDay("sunday");
            } else if (scheduleDay === "sunday") {
                changeMainContent("lists");
            }
        }
    } else if (mainContent === "lists") {
        if (swipeDirection === "right") {
            if (listsWindow === "categories") {
                changeMainContent("schedule");
            } else if (listsWindow === "status") {
                backToListsCategoryFromStatus();
            } else if (listsWindow === "media") {
                backToListsStatusFromMedia();
            }
        } else if (swipeDirection === "left") {
            if (listsWindow === "categories") {
                if ($.state.selected_list_category) {
                    viewListsCategory($.state.selected_list_category);
                }
            } else if (listsWindow === "status") {
                if ($.state.selected_list_category && $.state.selected_list_status) {
                    viewListsMedia($.state.selected_list_status);
                }
            }
        }
    }
});

detectSwipeDircetion($.id("[P]")[0], function (swipeDirection) {
    if (swipeDirection === "down") {
        hideMediaEditWindow();
    }
});

$.id("[L]-api_key_login_input").on("keypress", function (e) {
    if (e.which == 13) {
        apiKeyLogin();
    }
});

function queryAniList() {
    var cached = localStorage.getItem($.state.session_cache_id);
    if (cached && USE_CACHE) {
        $.state.sessionWatchList = JSON.parse(cached);
        generateAndDisplayContent($.state.sessionWatchList);
        return;
    }

    $.ajax({
        url: "https://graphql.anilist.co",
        method: "POST",
        timeout: 10000,
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: "Bearer " + $.state.session_token,
        },
        data: JSON.stringify({
            query: $.state.graphql,
            variables: {
                userid: $.state.session_id,
                username: $.state.session_name,
            },
        }),
        error: () => {
            makeNotification("Retrying !");
            console.log("retying");
            setTimeout(() => {
                reFreshCookieCrumb();
            }, 5000);
        },
        success: (response) => {
            var processedResponse = processResponse(response);

            var sessionWatchList = {};
            $.each(processedResponse, (_, media) => {
                sessionWatchList[String(media.id)] = media;
            });
            if (USE_CACHE) {
                localStorage.setItem($.state.session_cache_id, JSON.stringify(sessionWatchList));
            }

            $.state.sessionWatchList = sessionWatchList;

            generateAndDisplayContent(sessionWatchList);
        },
    });
}

function processResponse(response) {
    var cleaned = [];
    var processed = [];
    var media = response.data.ANIME.lists.concat(response.data.MANGA.lists);
    media = media.filter((list) => {
        return !list.isCustomList;
    });
    $.each(media, (_, entry) => {
        cleaned = cleaned.concat(entry.entries);
    });
    $.each(cleaned, (_, media) => {
        var media = media.media;
        processed.push({
            id: media.id,
            title: media.title.english || media.title.romaji || media.title.native,
            english: media.title.english,
            romaji: media.title.romaji,
            native: media.title.native,
            type: media.type,
            status: media.status,
            format: media.format,
            episodes: media.episodes || media.chapters,
            duration: media.duration || 0,
            cover: media.coverImage.large,
            url: media.siteUrl,
            list: media.mediaListEntry.status,
            progress: media.mediaListEntry.progress,
            next: media.nextAiringEpisode === null ? null : media.nextAiringEpisode.episode,
            airing: media.nextAiringEpisode === null ? null : media.nextAiringEpisode.airingAt,
            repeat: media.mediaListEntry.repeat,
            score: media.mediaListEntry.score,
            favourite: media.isFavourite,
            volumes: media.mediaListEntry.progressVolumes,
        });
    });
    return processed;
}

function toggleMainContentFormat(format = null) {
    if ($.state.current_main_content === "watchlist") {
        toggleWatchListFormat(format);
    } else if ($.state.current_main_content === "schedule") {
        toggleScheduleFormat(format);
    } else {
        toggleListsFormat(format);
    }
}

function toggleListsFormat(format = null) {
    if (format === null) {
        var convert_to = $.id("[H]-format_toggle").attr("data-active-format") === "grids" ? "stacked" : "grids";
    } else {
        var convert_to = format;
    }

    localStorage.setItem("LISTS_FORMAT", convert_to);

    $.id("[H]-format_toggle").attr("data-active-format", convert_to);
    $.id("[M]-lists").attr("data-current-lists-format", convert_to);
}

function toggleScheduleFormat(format = null) {
    if (format === null) {
        var convert_to = $.id("[H]-format_toggle").attr("data-active-format") === "grids" ? "stacked" : "grids";
    } else {
        var convert_to = format;
    }

    $.id("[H]-format_toggle").attr("data-active-format", convert_to);
    $.id("[M]-schedule").attr("data-current-schedule-format", convert_to);

    $.state.current_schedule_format = convert_to;
    localStorage.setItem("SCHEDULE_FORMAT", convert_to);

}

function toggleWatchListFormat(format = null) {
    if (format === null) {
        var convert_to = $.id("[H]-format_toggle").attr("data-active-format") === "grids" ? "stacked" : "grids";
    } else {
        var convert_to = format;
    }

    localStorage.setItem("WATCHLIST_FORMAT", convert_to);

    $.id("[H]-format_toggle").attr("data-active-format", convert_to);

    $.id("[M]-watchlist").attr("data-current-watchlist-format", convert_to);

}

function getTodaysDate() {
    var daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    return daysOfWeek[new Date().getDay()];
}

function humantimeFormat(__time_in_seconds, left = true) {
    if (__time_in_seconds === null || __time_in_seconds === "null") {
        return "";
    }

    var __seconds;

    if (left) {
        __seconds = Math.round(new Date(__time_in_seconds * 1000).getTime() / 1000) - Math.round(new Date().getTime() / 1000);
    } else {
        __seconds = __time_in_seconds;
    }
    const day = Math.floor(__seconds / (3600 * 24));
    const hour = Math.floor((__seconds / 3600) % 24);
    const minute = Math.floor((__seconds % 3600) / 60);

    var result = day > 0 ? `${day}<span>d</span> ${hour + (minute > 30 ? 1 : 0)}<span>h</span>` : hour > 0 ? `${hour}<span>h</span> ${minute}<span>m</span>` : `${minute}<span>m</span>`;

    return result.replace(/0/g, "O");
}

function updateScheduleTime(mediaId, formatter) {
    var currentTime = new Date();
    var _formatter;

    if (formatter === "stacked") {
        _formatter = (_) => {
            return _.replace(/0/g, "O");
        };
    } else {
        _formatter = (_) => {
            return _.replace(/Aired at /g, "")
                .replace(/></g, ">:<")
                .replace(/0/g, "O");
        };
    }

    var airing = new Date($.state.sessionWatchList[mediaId].airing * 1000);
    var _seconds = Math.round(airing.getTime() / 1000) - Math.round(currentTime.getTime() / 1000);

    if (airing.getDay() === currentTime.getDay()) {
        var airs_at_hour = airing.getHours();
        var airs_at_minute = airing.getMinutes();

        var airsToday = airs_at_hour * 60 * 60 + airs_at_minute * 60 + airing.getSeconds();
        var todaysSeconds = currentTime.getHours() * 60 * 60 + currentTime.getMinutes() * 60 + currentTime.getSeconds();

        if (airsToday < todaysSeconds) {
            var widget = $.attribute("updating-airing-time-widget-id", mediaId);
            widget.attr("data-has-media-aired", "true");
            var meridian = "AM";
            if (airs_at_hour > 12) {
                airs_at_hour = airs_at_hour - 12;
                meridian = "PM";
            }
            if (airs_at_hour < 10) {
                airs_at_hour = "0" + String(airs_at_hour);
            }
            if (airs_at_minute < 10) {
                airs_at_minute = "0" + String(airs_at_minute);
            }
            return {
                aired: true,
                html: _formatter(`Aired at ${airs_at_hour}:${airs_at_minute} ${meridian}`),
            };
        }
    }

    var day = Math.floor(_seconds / (3600 * 24));
    var hour = Math.floor((_seconds / 3600) % 24);
    var minute = Math.floor((_seconds % 3600) / 60);
    var seconds = Math.floor(_seconds % 60);

    return {
        aired: false,
        html: _formatter(`<i day>${day}</i><i hour>${hour}</i><i minute>${minute}</i><i second>${seconds}</i>`),
    };
}

function displayFooterInfo(data) {
    data = data.filter((_) => {
        return _.airing;
    });
    $.id("[F].fotter_schedule").html(nunjucks.renderString($.id("[F]-schedule@template").html(), { collection: data }));
    if ($.state.footer_update_interval) {
        clearInterval($.state.footer_update_interval);
    }
    var updateFooter = () => {
        var updatableItems = $("[data-footer-airing-schedule]");
        updatableItems.each((_, _element) => {
            var element = $(_element);
            var currentTime = new Date();
            var mediaId = element.attr("data-footer-airing-schedule");
            var airing = new Date($.state.sessionWatchList[Number(mediaId)].airing * 1000);
            var secondsUntilAir = Math.round(airing.getTime() / 1000) - Math.round(currentTime.getTime() / 1000);
            if (secondsUntilAir > 0) {
                var day = Math.floor(secondsUntilAir / (3600 * 24));
                var hour = Math.floor((secondsUntilAir / 3600) % 24);
                var minute = Math.floor((secondsUntilAir % 3600) / 60);
                var seconds = Math.floor(secondsUntilAir % 60);
                element.html(`${day < 10 ? 0 : ""}${day}:${hour < 10 ? 0 : ""}${hour}:${minute < 10 ? 0 : ""}${minute}:${seconds < 10 ? 0 : ""}${seconds}`);
            } else {
                $.attribute("footer-schedule-id", mediaId).remove();
                $.attribute("footer-schedule-division-id", mediaId).remove();
            }
        });
        if (updatableItems.length <= 0) {
            $.id("[F].fotter_schedule").html(`<span class="mx-3 text-center flex items-center justify-center leading-tight text-[0.6rem] text-crumb-bright/30 h-full" onclick="event.stopPropagation();reFreshCookieCrumb()">Click to Refresh.</span>`);
            clearInterval($.state.footer_update_interval);
        }
    };
    updateFooter();
    $.state.footer_update_interval = setInterval(updateFooter, 900);
}

function generateAndDisplayContent(data) {
    var _data = [];
    $.each(data, (id, media) => {
        _data.push(media);
    });
    _data.sort((o1, o2) => {
        return o1.airing - o2.airing;
    });

    displayFooterInfo(_data);

    var watchlist_content = generateWatchListContent(_data);
    var schedule_content = generateScheduleContent(_data);

    displayWatchListContentStacked(watchlist_content);
    displayWatchListContentGrids(watchlist_content);

    var media_id_category_pair = {};
    $.each(watchlist_content, (_, category) => {
        $.each(category.content, (_, media) => {
            media_id_category_pair[String(media.id)] = category.category;
        });
    });

    displayScheduleStacked(schedule_content, media_id_category_pair);
    displayScheduleGrids(schedule_content, media_id_category_pair);

    if ($.state.schedule_update_interval) {
        clearInterval($.state.schedule_update_interval);
    }

    $.state.schedule_update_interval = setInterval(() => {
        if ($.state.current_main_content === "schedule") {
            var search_in_elements;
            if ($.state.current_schedule_format === "stacked") {
                search_in_elements = $("[updating-airing-time]", $.attribute("schedule-of-day", $.state.current_schedule_day_active));
            } else {
                search_in_elements = $("[updating-airing-time]", $.id("[M]-schedule.grids.content"));
            }
            search_in_elements.each((_, _element) => {
                var element = $(_element);
                var mediaId = String(element.attr("updating-airing-time"));
                element.html(updateScheduleTime(mediaId, $.state.current_schedule_format).html);
            });
        }
    }, 900);

    var lastUsedMainContent = localStorage.getItem("MAIN_CONTENT") || "watchlist";
    var lastUsedScheduleFormat = localStorage.getItem("SCHEDULE_FORMAT") || "grids";
    var lastUsedWatchListFormat = localStorage.getItem("WATCHLIST_FORMAT") || "grids";
    var lastUsedListFormat = localStorage.getItem("LISTS_FORMAT") || "grids";
    var lastUsedWatchListType = localStorage.getItem("WATCHLIST_TYPE") || "anime";

    toggleListsFormat(lastUsedListFormat);
    toggleScheduleFormat(lastUsedScheduleFormat);
    toggleWatchListFormat(lastUsedWatchListFormat);
    toggleWatchListType(lastUsedWatchListType);

    setTimeout(() => {
        scrollGridScheduleIntoView(getTodaysDate(), "instant");
    }, 100);
    setTimeout(() => {
        changeScheduleDay(getTodaysDate(), "instant");
    }, 100);

    setTimeout(() => {
        changeMainContent(lastUsedMainContent);
    }, 50);

    $("img[lazyload]").lazyload();

    setTimeout(() => {
        removeWaitingPage();
    }, 200);

    setTimeout(() => {
        fetchAndDisplayListsContent("ANIME");
    }, 500);
}

function scrollGridScheduleIntoView(day, behavior = "smooth") {
    var element = $.attribute("data-grid-schedule-category", day);
    element[0].scrollIntoView({
        behavior: behavior,
        block: "start",
    });
}

function getElementVisibilityPercentage(element) {
    var rect = element.getBoundingClientRect();
    var winHeight = window.innerHeight || document.documentElement.clientHeight;
    if (rect.bottom < 0) {
        return 0;
    } else if (rect.top >= winHeight) {
        return 0;
    } else {
        var visibleHeight = Math.min(rect.bottom, winHeight) - Math.max(rect.top, 0);
        var elementHeight = rect.height;
        var percentage = Math.max(0, visibleHeight) / elementHeight;
        return percentage;
    }
}

$(document).ready(() => {
    $.id("[M]-schedule.grids.content").scroll(() => {
        var percentages = {};
        $("[data-grid-schedule-category]").each((_, element) => {
            percentages[element.getAttribute("data-grid-schedule-category")] = getElementVisibilityPercentage(element);
        });
        var maxVisible = Object.entries(percentages).sort((o1, o2) => o2[1] - o1[1]);
        var active = maxVisible[0][0];
        if (percentages["sunday-padding"] === 1 || active === "sunday-padding") {
            active = "sunday";
        }
        $("[data-scrolled-schedule-day]").attr("data-scrolled-schedule-day", active);
    });
});

function toggleMoreInfoScheduleGrid(mediaId) {
    var element = $.attribute("schedule-grid-block-id", mediaId);
    var action = element.attr("data-show-more-info") === "true" ? "false" : "true";
    element.attr("data-show-more-info", action);

    if (action === "true") {
        if ($.state.last_active_more_info_schedule_grid && $.state.last_active_more_info_schedule_grid !== mediaId) {
            $.attribute("schedule-grid-block-id", $.state.last_active_more_info_schedule_grid).attr("data-show-more-info", "false");
        }
        $.state.last_active_more_info_schedule_grid = mediaId;
    }
}

function generateScheduleContent(data) {
    var schedule = [];

    var airing = data.filter((media) => {
        return media.airing !== null;
    });

    var sectionMonday = airing.filter((media) => {
        return new Date(media.airing * 1000).getDay() === 1;
    });
    var sectionTuesday = airing.filter((media) => {
        return new Date(media.airing * 1000).getDay() === 2;
    });
    var sectionWednesday = airing.filter((media) => {
        return new Date(media.airing * 1000).getDay() === 3;
    });
    var sectionThursday = airing.filter((media) => {
        return new Date(media.airing * 1000).getDay() === 4;
    });
    var sectionFriday = airing.filter((media) => {
        return new Date(media.airing * 1000).getDay() === 5;
    });
    var sectionSaturday = airing.filter((media) => {
        return new Date(media.airing * 1000).getDay() === 6;
    });
    var sectionSunday = airing.filter((media) => {
        return new Date(media.airing * 1000).getDay() === 0;
    });

    schedule.push({
        category: "monday",
        content: sectionMonday,
        name: "Monday",
    });
    schedule.push({
        category: "tuesday",
        content: sectionTuesday,
        name: "Tuesday",
    });
    schedule.push({
        category: "wednesday",
        content: sectionWednesday,
        name: "Wednesday",
    });
    schedule.push({
        category: "thursday",
        content: sectionThursday,
        name: "Thursday",
    });
    schedule.push({
        category: "friday",
        content: sectionFriday,
        name: "Friday",
    });
    schedule.push({
        category: "saturday",
        content: sectionSaturday,
        name: "Saturday",
    });
    schedule.push({
        category: "sunday",
        content: sectionSunday,
        name: "Sunday",
    });

    return schedule;
}

function changeScheduleDay(day, behavior = "smooth") {
    $("[data-active-day]").attr("data-active-day", day);
    var active_item = $.id("[M]-schedule.stacked.section@" + day);
    active_item[0].scrollIntoView({
        behavior: behavior,
        block: "nearest",
    });
    $.state.current_schedule_day_active = day;
}

function displayScheduleStacked(data, relations) {
    var daysOfWeek = {
        monday: "Monday",
        tuesday: "Tuesday",
        wednesday: "Wednesday",
        thursday: "Thursday",
        friday: "Friday",
        saturday: "Saturday",
        sunday: "Sunday",
    };
    $.id("[M]-schedule.stacked.content").html(nunjucks.renderString($.id("[M]-schedule.stacked@template").html(), { collection: data, humanTime: humantimeFormat, daysOfWeek: daysOfWeek, relations: relations, scheduleTimePlaceHolder: updateScheduleTime, getTodaysDate: getTodaysDate }));
}

function displayScheduleGrids(data, relations) {
    $.id("[M]-schedule.grids.content").html(nunjucks.renderString($.id("[M]-schedule.grids@template").html(), { collection: data, humanTime: humantimeFormat, relations: relations, scheduleTimePlaceHolder: updateScheduleTime, getTodaysDate: getTodaysDate }));
}

function gridMoreInfoDisplayToggle(mediaId) {
    if ($.state.more_info_grid_id !== mediaId) {
        $("[data-is-clicked]", $("[data-grid-id=" + $.state.more_info_grid_id + "]")).attr("data-is-clicked", "false");
    }
    $.state.more_info_grid_id = mediaId;
    var element = $("[data-is-clicked]", $("[data-grid-id=" + mediaId + "]"));
    element.attr("data-is-clicked", element.attr("data-is-clicked") == "true" ? "false" : "true");
}

function displayWatchListContentGrids(data) {
    $.id("[M]-watchlist.grids.content").html(nunjucks.renderString($.id("[M]-watchlist.grids@template").html(), { categories: data, humanTime: humantimeFormat, getIcon: getWatchListIcon }));
}

function displayWatchListContentStacked(data) {
    $.id("[M]-watchlist.stacked.content").html(nunjucks.renderString($.id("[M]-watchlist.stacked@template").html(), { categories: data, humanTime: humantimeFormat, getIcon: getWatchListIcon }));
}

function showMediaEditWindow(mediaId, category) {
    var media = $.state.sessionWatchList[String(mediaId)];

    var title = $.id("[P].media_title");
    title.text(media.title);
    if (title.textWidth() > title.parent().width()) {
        title.wrap('<marquee id="[P]@__remove_marquee"></marquee>');
    }
    $.id("[P].current_status").attr("data-current-status-id", media.list);
    $.id("[P].current_status").attr("data-current-status-window-media-type", media.type);
    $.id("[P].status_and_volume_container").attr("data-current-status-window-media-type", media.type);
    $.id("[P].repeats").val(media.repeat);
    $.id("[P].repeats").attr("data-last-valid-value", media.repeat);
    $.id("[P].volumes").val(media.volumes);
    $.id("[P].volumes").attr("data-last-valid-value", media.volumes);
    $.id("[P].progress").val(media.progress);
    $.id("[P].progress").attr("data-last-valid-value", media.progress);
    var max_progress_possible;
    if (media.next) {
        max_progress_possible = media.next - 1;
    } else if (media.episodes) {
        max_progress_possible = media.episodes;
    } else {
        max_progress_possible = "infinite";
    }
    $.id("[P].progress").attr("data-max-episodes", max_progress_possible);

    $.id("[S].status_sellection.current").attr("data-current-status-window-media-type", media.type);
    $.id("[S].status_sellection.planning").attr("data-current-status-window-media-type", media.type);

    $.id("[P].media_liked").attr("data-is-media-liked", media.favourite);

    $.id("[P].score_input").val(media.score);
    $.id("[P].score_input").attr("data-last-valid-value", media.score);
    $.id("[P].score_slider").val(media.score);

    $.id("[P].save").attr("data-current-status-window-id", media.id);
    $.id("[P].save").attr("data-current-status-window-media-type", media.type);
    $.id("[P].save").attr("data-current-status-window-category", category);

    $.id("[P].site_link").attr("href", media.url);

    $.id("[P].media_name_en").attr("data-clipboard-text", media.english);
    $.id("[P].media_name_ro").attr("data-clipboard-text", media.romaji);
    $.id("[P].media_name_jp").attr("data-clipboard-text", media.native);

    $.id("[P]").attr("data-is-active", "true");

    $.id("[P]-screen").fadeIn();

}

function addMediaToFavourite() {
    var button = $.id("[P].media_liked");
    var set = button.attr("data-is-media-liked") === "true" ? "false" : "true";
    button.attr("data-is-media-liked", set);
}

function toggleWatchListType(type) {
    var toggle = $.id("[M]-watchlist.type");
    if ($.state.current_main_content_type === type) {
        return;
    }

    $.state.current_main_content_type = type;
    localStorage.setItem("WATCHLIST_TYPE", type);

    $.id("[M]-watchlist.stacked.content").attr("data-display-media-type", type);
    $.id("[M]-watchlist.grids.content").attr("data-display-media-type", type);
    toggle.attr("data-watchlist-type", type);
}

function saveCurrentMediaStatusWindow() {
    var mediaid = Number($.id("[P].save").attr("data-current-status-window-id"));
    var variables = {
        mediaid: mediaid,
        status: String($.id("[P].current_status").attr("data-current-status-id")).toUpperCase(),
        score: Number($.id("[P].score_input").val()),
        repeat: Number($.id("[P].repeats").val()),
        progress: Number($.id("[P].progress").val()),
    };
    if ($.id("[P].save").attr("data-current-status-window-media-type") === "ANIME") {
        variables["mediaid_anime"] = mediaid;
    } else {
        variables["mediaid_manga"] = mediaid;
        variables["volumes"] = Number($.id("[P].volumes").val());
    }

    var toggle_like = false;
    var like_button_state = $.id("[P].media_liked").attr("data-is-media-liked") === "true" ? true : false;
    if (like_button_state !== $.state.sessionWatchList[mediaid].favourite) {
        toggle_like = true;
    }

    var ui_stacked = $.attribute("data-stacked-id", String(mediaid));
    var ui_grid = $.attribute("data-grid-id", String(mediaid));

    $("[data-is-updating]", ui_stacked).attr("data-is-updating", "true");
    $("[data-is-updating]", ui_grid).attr("data-is-updating", "true");
    $.id("[P].save").attr("data-is-saving", "true");

    $.ajax({
        url: "https://graphql.anilist.co",
        method: "POST",
        timeout: 40000,
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: "Bearer " + $.state.session_token,
        },
        data: JSON.stringify({
            query: toggle_like ? $.state.status_window_graphql_with_like_toggle : $.state.status_window_graphql,
            variables: variables,
        }),
        error: () => {
            makeNotification("Failed to Update !");
            $.id("[P].save").attr("data-is-saving", "false");
            $("[data-is-updating]", ui_stacked).attr("data-is-updating", "false");
            $("[data-is-updating]", ui_grid).attr("data-is-updating", "false");
        },
        success: (response) => {
            var media = $.state.sessionWatchList[mediaid];
            var original_progress = media.progress;

            media.list = response.data.SaveMediaListEntry.status;
            media.progress = response.data.SaveMediaListEntry.progress;
            media.repeat = response.data.SaveMediaListEntry.repeat;
            media.score = response.data.SaveMediaListEntry.score;
            media.volumes = response.data.SaveMediaListEntry.progressVolumes;

            if (toggle_like) {
                media.favourite = !media.favourite;
            }

            $.id("[P].current_status").attr("data-current-status-id", media.list);
            $.id("[P].repeats").val(media.repeat);
            $.id("[P].repeats").attr("data-last-valid-value", media.repeat);
            $.id("[P].volumes").val(media.volumes);
            $.id("[P].volumes").attr("data-last-valid-value", media.volumes);
            $.id("[P].progress").val(media.progress);
            $.id("[P].progress").attr("data-last-valid-value", media.progress);
            $.id("[P].media_liked").attr("data-is-media-liked", media.favourite);
            $.id("[P].score_input").val(media.score);
            $.id("[P].score_input").attr("data-last-valid-value", media.score);
            $.id("[P].score_slider").val(media.score);

            var maxupdate;
            if (media.next) {
                maxupdate = media.next - 1;
            } else if (media.episodes) {
                maxupdate = media.episodes;
            } else {
                maxupdate = Infinity;
            }
            var category = $.id("[P].save").attr("data-current-status-window-category");

            var episodeleft = $.attribute("data-category-left-episode", category);
            var durationleft = $.attribute("data-category-left-duration", category);

            var current_episodeleft = Number(episodeleft.attr("data-left-episode"));
            var current_durationleft = Number(durationleft.attr("data-left-duration"));

            var available_episodes;

            if (media.next) {
                available_episodes = media.next - 1;
            } else {
                available_episodes = media.episodes;
            }
            if (media.progress > available_episodes) {
                available_episodes = media.progress;
            }
            var current_progress = media.progress;
            if (media.list !== "CURRENT" && media.list !== "REPEATING") {
                current_progress = available_episodes;
            }

            var progress_changed = current_progress - original_progress;

            var new_duration_left = current_durationleft - response.data.SaveMediaListEntry.media.duration * 60 * progress_changed;

            if (current_episodeleft - progress_changed < 1) {
                episodeleft.parent().addClass("hidden");
            } else {
                episodeleft.attr("data-left-episode", current_episodeleft - progress_changed);
                episodeleft.html(current_episodeleft - progress_changed);
            }

            if (new_duration_left < 60) {
                durationleft.addClass("hidden");
            } else {
                durationleft.html(humantimeFormat(new_duration_left, false));
            }

            var percentage_complete = (media.progress / (media.episodes || media.progress)) * 100;
            $("[stacked-percentage-progress-indicator]", ui_stacked).attr("style", `--percentage-complete: ${percentage_complete}%`);

            if (media.progress >= maxupdate) {
                $("[data-is-updating]", ui_stacked).attr("data-is-updating", "maxed");
                $("[data-not-complete]", ui_stacked).attr("data-not-complete", "false");
                $("[data-is-updating]", ui_grid).attr("data-is-updating", "maxed");
                $("[current-progress-indicator]", ui_stacked).html(media.progress);
                $("[current-progress-indicator]", ui_grid).html(media.progress);

                if (category.endsWith("InProgress") || (category === "delayedAnime" && media.episodes)) {
                    ui_stacked.remove();
                    ui_grid.remove();
                    normalizeEmptyUI();
                }
            } else {
                $("[current-progress-indicator]", ui_stacked).html(media.progress);
                $("[data-not-complete]", ui_stacked).attr("data-not-complete", "true");
                $("[current-progress-indicator]", ui_grid).html(media.progress);
                $("[next-progress-indicator]", ui_stacked).html(String(media.progress + 1) + "?");
                $("[next-progress-indicator]", ui_grid).html(String(media.progress + 1) + "?");
                $("[data-is-updating]", ui_stacked).attr("data-is-updating", "false");
                $("[data-is-updating]", ui_grid).attr("data-is-updating", "false");
            }

            if (media.list !== "CURRENT" && media.list !== "REPEATING") {
                ui_stacked.remove();
                ui_grid.remove();
                $.attribute("schedule-block-stacked-id", String(mediaid)).remove();
                $.attribute("schedule-grid-block-id", String(mediaid)).remove();
                normalizeEmptyUI();
            }

            $.id("[P].save").attr("data-is-saving", "false");
        },
    });
}

function normalizeEmptyUI() {
    $("[watchlist-section]").each((_, _element) => {
        var element = $(_element);
        var section = element.attr("watchlist-section");
        var sectionItems = $.attribute("watchlist-section-item", section);
        if (sectionItems.length < 1) {
            sectionItems.remove();
            element.remove();
            $.attribute("watchlist-section-sub-item", section).remove();
        }
    });
    $("[schedule-of-day]").each((_, _element) => {
        var element = $(_element);
        var day = element.attr("schedule-of-day");
        var sectionItems = $.attribute("schedule-of-day-item", day);
        if (sectionItems.length < 1) {
            var is_already_empty = $("[schedule-of-day-is-empty]", element).length > 0;
            if (!is_already_empty) {
                element.html(`<span class="text-xs w-full h-full flex items-center justify-center text-crumb-bright/30 text-pretty text-center px-3 italic" schedule-of-day-is-empty>None of the anime from your watchlist airs on this day.</span>`);
            }
        }
    });
    $("[data-grid-schedule-category]").each((_, _element) => {
        var element = $(_element);
        var day = element.attr("data-grid-schedule-category");
        var sectionItems = $.attribute("grid-of-schedule-item", day);
        if (day !== "sunday-padding") {
            if (sectionItems.length < 1) {
                var is_already_empty = $("[schedule-of-day-is-empty]", element).length > 0;
                if (!is_already_empty) {
                    $.attribute("schedule-grid-of-day", day).html(`<span class="text-xs w-full h-full flex items-center justify-center text-crumb-bright/40 text-pretty text-center italic col-span-3 py-3" schedule-of-day-is-empty>No anime airing.</span>`);
                }
            }
        }
    });
}

$(document).ready(() => {
    ((clipboard) => {
        clipboard.on("success", function (element) {
            makeNotification("copied");
            element.clearSelection();
        });
    })(new ClipboardJS("[clipboard-item]"));
});

$(document).ready(() => {
    $.id("[P].score_input").bind("change keyup", function () {
        let input = $.id("[P].score_input");
        let slider = $.id("[P].score_slider");

        var value = Number(input.val()) || null;
        if (Number(input.val()) === 0) {
            value = 0;
        }

        if (value === null && input.val() !== "") {
            value = Number(input.attr("data-last-valid-value"));
            input.val(value);
        } else if (input.val() === "") {
            input.attr("data-last-valid-value", 0);
            value = 0;
        } else {
            if (value > 100) {
                value = 100;
                input.val(value);
            }
            input.attr("data-last-valid-value", value);
        }

        slider.val(value);
    });
});

$(document).ready(() => {
    $.each([$.id("[P].repeats"), $.id("[P].progress")], (_, element) => {
        element.bind("change keyup", function () {
            let input = $(this);
            let val = Number(input.val()) || null;
            if (val === null && input.val() !== "") {
                input.val(element.attr("data-last-valid-value") || 0);
            }
            if (input.val() === "") {
                element.attr("data-last-valid-value", 0);
            } else {
                element.attr("data-last-valid-value", val);
            }
        });
    });
});

function makeNotification(notification) {
    if ($.state.notification_interval) {
        clearTimeout($.state.notification_interval);
    }
    $.id("[N]").attr("data-is-active", "true");
    $.id("[N].content").html(notification);
    $.state.notification_interval = setTimeout(() => {
        $.state.notification_interval = null;
        $.id("[N]").attr("data-is-active", "false");
    }, 4000);
}

function updateMediaEditWindowInput(target, value) {
    var element = $.id("[P]." + target);
    var max = element.attr("data-max-episodes");
    var current = Number(element.val()) || 0;
    var updated = current + value;
    if (updated < 0) {
        element.val(0);
        return;
    }
    if (max === undefined || max === "infinite") {
        element.val(updated);
        return;
    }
    if (updated > Number(max)) {
        updated = Number(max);
    }
    element.val(updated);
    element.attr("data-last-valid-value", updated);
}

function hideMediaEditWindow() {

    $.id("[P]").attr("data-is-active", "false");
    $.id("[P]@__remove_marquee").replaceWith($.id("[P]@__remove_marquee").html());

    $.id("[P]-screen").fadeOut();

}

function ShowstatusSelectWindow() {
    $("[data-is-status-selected]").attr("data-is-status-selected", "false");
    $.attribute("data-status-id", $.id("[P].current_status").attr("data-current-status-id")).attr("data-is-status-selected", "true");

    $.id("[S]").attr("data-is-active", "true");
    $.id("[S]-screen").fadeIn();

}

function hideStatusSelectWindow() {
    $.id("[S]").attr("data-is-active", "false");

    $.id("[S]-screen").fadeOut();

}

function setStatusWindowValue(status) {
    if (status !== null) {
        $.id("[P].current_status").attr("data-current-status-id", status);
    }
    hideStatusSelectWindow();
}

function getWatchListIcon(category) {
    return $.id("[M]-watchlist@icon." + category).html();
}

function calculateLeftover(section) {
    var episode = 0;
    var duration = 0;
    $.each(section, (_, media) => {
        var available;
        if (media.next) {
            available = media.next - 1;
        } else {
            available = media.episodes;
        }
        if (media.progress > available) {
            available = media.progress;
        }
        var left_episodes = available - media.progress;
        episode = episode + left_episodes;
        duration = duration + (media.duration || 0) * left_episodes;
    });
    return {
        episode: episode,
        duration: duration * 60,
    };
}

function generateWatchListContent(data) {
    var sectionAiringAnime = data.filter((media) => {
        return media.next !== null && media.status === "RELEASING" && media.type === "ANIME";
    });

    var sectionDelayedAnime = data.filter((media) => {
        return media.next === null && media.status === "RELEASING" && media.format !== "MUSIC" && media.format !== "MOVIE" && media.type === "ANIME";
    });

    var sectionAnimeInProgress = data.filter((media) => {
        return media.next === null && media.status === "FINISHED" && media.format !== "MUSIC" && media.format !== "MOVIE" && media.type === "ANIME";
    });

    var sectionMovieInProgress = data.filter((media) => {
        return media.next === null && (media.status === "FINISHED" || media.status === "RELEASING") && media.format === "MOVIE" && media.type === "ANIME";
    });

    var sectionMusicInProgress = data.filter((media) => {
        return media.next === null && (media.status === "FINISHED" || media.status === "RELEASING") && media.format === "MUSIC" && media.type === "ANIME";
    });

    var sectionUpcomingAnime = data.filter((media) => {
        return media.status === "NOT_YET_RELEASED" && media.type === "ANIME";
    });

    var sectionAnimeOnHiatus = data.filter((media) => {
        return media.status === "HIATUS" && media.type === "ANIME";
    });

    var sectionAiringManga = data.filter((media) => {
        return media.format !== "NOVEL" && media.type === "MANGA" && media.status === "RELEASING";
    });

    var sectionMangaInProgress = data.filter((media) => {
        return media.format !== "NOVEL" && media.type === "MANGA" && media.status !== "RELEASING";
    });

    var sectionNovelInProgress = data.filter((media) => {
        return media.format === "NOVEL" && media.type === "MANGA";
    });

    var watchlist = [];

    if (sectionAiringAnime.length) {
        watchlist.push({
            category: "airingAnime",
            content: sectionAiringAnime,
            name: "Airing Anime",
            type: "anime",
            left: calculateLeftover(sectionAiringAnime),
        });
    }
    if (sectionDelayedAnime.length) {
        watchlist.push({
            category: "delayedAnime",
            content: sectionDelayedAnime,
            name: "Delayed Anime",
            type: "anime",
            left: calculateLeftover(sectionDelayedAnime),
        });
    }
    if (sectionAnimeInProgress.length) {
        watchlist.push({
            category: "animeInProgress",
            content: sectionAnimeInProgress,
            name: "Anime in Progress",
            type: "anime",
            left: calculateLeftover(sectionAnimeInProgress),
        });
    }
    if (sectionMovieInProgress.length) {
        watchlist.push({
            category: "movieInProgress",
            content: sectionMovieInProgress,
            name: "Movie in Progress",
            type: "anime",
            left: calculateLeftover(sectionMovieInProgress),
        });
    }
    if (sectionMusicInProgress.length) {
        watchlist.push({
            category: "musicInProgress",
            content: sectionMusicInProgress,
            name: "Music in Progress",
            type: "anime",
            left: calculateLeftover(sectionMusicInProgress),
        });
    }
    if (sectionUpcomingAnime.length) {
        watchlist.push({
            category: "upcomingAnime",
            content: sectionUpcomingAnime,
            name: "Upcoming Anime",
            type: "anime",
            left: calculateLeftover(sectionUpcomingAnime),
        });
    }
    if (sectionAnimeOnHiatus.length) {
        watchlist.push({
            category: "animeOnHiatus",
            content: sectionAnimeOnHiatus,
            name: "Anime on Hiatus",
            type: "anime",
            left: calculateLeftover(sectionAnimeOnHiatus),
        });
    }
    if (sectionAiringManga.length) {
        watchlist.push({
            category: "airingManga",
            content: sectionAiringManga,
            name: "Releasing Manga",
            type: "manga",
            left: calculateLeftover(sectionAiringManga),
        });
    }
    if (sectionMangaInProgress.length) {
        watchlist.push({
            category: "mangaInProgress",
            content: sectionMangaInProgress,
            name: "Manga in Progress",
            type: "manga",
            left: calculateLeftover(sectionMangaInProgress),
        });
    }
    if (sectionNovelInProgress.length) {
        watchlist.push({
            category: "novelInProgress",
            content: sectionNovelInProgress,
            name: "Novel in Progress",
            type: "manga",
            left: calculateLeftover(sectionNovelInProgress),
        });
    }

    return watchlist;
}

function incrementMedia(mediaId, category) {
    var ui_stacked = $.attribute("data-stacked-id", mediaId);
    var ui_grid = $.attribute("data-grid-id", mediaId);

    $("[data-is-updating]", ui_stacked).attr("data-is-updating", "true");
    $("[data-is-updating]", ui_grid).attr("data-is-updating", "true");

    var id = Number(mediaId);
    var updated = $.state.sessionWatchList[id].progress + 1;

    $.ajax({
        url: "https://graphql.anilist.co",
        method: "POST",
        timeout: 40000,
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: "Bearer " + $.state.session_token,
        },
        data: JSON.stringify({
            query: $.state.increment_graphql,
            variables: {
                mediaid: id,
                progress: updated,
            },
        }),
        error: () => {
            makeNotification("Failed to Update !");
            $("[data-is-updating]", ui_stacked).attr("data-is-updating", "false");
            $("[data-is-updating]", ui_grid).attr("data-is-updating", "false");
        },
        success: (response) => {
            var media = $.state.sessionWatchList[id];
            media.progress = response.data.SaveMediaListEntry.progress;
            var maxupdate;

            if (media.next) {
                maxupdate = media.next - 1;
            } else if (media.episodes) {
                maxupdate = media.episodes;
            } else {
                maxupdate = Infinity;
            }

            var episodeleft = $.attribute("data-category-left-episode", category);
            var durationleft = $.attribute("data-category-left-duration", category);
            var current_episodeleft = Number(episodeleft.attr("data-left-episode"));
            var current_durationleft = Number(durationleft.attr("data-left-duration"));
            var new_duration_left = current_durationleft - response.data.SaveMediaListEntry.media.duration * 60;

            if (current_episodeleft <= 1) {
                episodeleft.parent().addClass("hidden");
            } else {
                episodeleft.attr("data-left-episode", current_episodeleft - 1);
                episodeleft.html(current_episodeleft - 1);
            }

            if (new_duration_left < 60) {
                durationleft.addClass("hidden");
            } else {
                durationleft.html(humantimeFormat(new_duration_left, false));
            }

            var percentage_complete = (media.progress / (media.episodes || media.progress)) * 100;
            $("[stacked-percentage-progress-indicator]", ui_stacked).attr("style", `--percentage-complete: ${percentage_complete}%`);

            if (media.progress >= maxupdate) {
                $("[data-is-updating]", ui_stacked).attr("data-is-updating", "maxed");
                $("[data-not-complete]", ui_stacked).attr("data-not-complete", "false");
                $("[data-is-updating]", ui_grid).attr("data-is-updating", "maxed");
                $("[current-progress-indicator]", ui_stacked).html(media.progress);
                $("[current-progress-indicator]", ui_grid).html(media.progress);
                if (category.endsWith("InProgress") || (category === "delayedAnime" && media.episodes)) {
                    ui_stacked.remove();
                    ui_grid.remove();
                    normalizeEmptyUI();
                }
            } else {
                $("[data-not-complete]", ui_stacked).attr("data-not-complete", "true");
                $("[current-progress-indicator]", ui_stacked).html(media.progress);
                $("[current-progress-indicator]", ui_grid).html(media.progress);
                $("[next-progress-indicator]", ui_stacked).html(String(media.progress + 1) + "?");
                $("[next-progress-indicator]", ui_grid).html(String(media.progress + 1) + "?");
                $("[data-is-updating]", ui_stacked).attr("data-is-updating", "false");
                $("[data-is-updating]", ui_grid).attr("data-is-updating", "false");
            }
        },
    });
}

function displayListsContent(format, data) {
    $.id("[M]-lists.mediaContent.stacked").append(nunjucks.renderString($.id("[M]-lists.mediaContent@template.stacked").html(), { data: data, format: format }));
    $.id("[M]-lists.mediaContent.grids").append(nunjucks.renderString($.id("[M]-lists.mediaContent@template.grids").html(), { data: data, format: format }));
    $.attribute("data-lists-cetegory", format).attr("data-is-loading", "false");
    $("img[lazyload]").lazyload();
}

function resetListsView() {
    $.id("[M]-lists.mediaContent.stacked").empty();
    $.id("[M]-lists.mediaContent.grids").empty();
    $.each(["ANIME", "MUSIC", "MANGA", "NOVEL", "MOVIE", "SPECIAL"], (_, format) => {
        $.attribute("data-lists-cetegory", format).attr("data-is-loading", "true");
    });
    backToListsCategoryFromStatus();
    $.state.selected_list_category = undefined;
    $.state.selected_list_status = undefined;
}

function processListsContent(response) {
    var output = {
        ANIME: {
            CURRENT: [],
            PLANNING: [],
            COMPLETED: [],
            DROPPED: [],
            PAUSED: [],
            REPEATING: [],
        },
        MUSIC: {
            CURRENT: [],
            PLANNING: [],
            COMPLETED: [],
            DROPPED: [],
            PAUSED: [],
            REPEATING: [],
        },
        MANGA: {
            CURRENT: [],
            PLANNING: [],
            COMPLETED: [],
            DROPPED: [],
            PAUSED: [],
            REPEATING: [],
        },
        NOVEL: {
            CURRENT: [],
            PLANNING: [],
            COMPLETED: [],
            DROPPED: [],
            PAUSED: [],
            REPEATING: [],
        },
        MOVIE: {
            CURRENT: [],
            PLANNING: [],
            COMPLETED: [],
            DROPPED: [],
            PAUSED: [],
            REPEATING: [],
        },
        SPECIAL: {
            CURRENT: [],
            PLANNING: [],
            COMPLETED: [],
            DROPPED: [],
            PAUSED: [],
            REPEATING: [],
        },
    };
    $.each(["chunk_1", "chunk_2", "chunk_3", "chunk_4", "chunk_5", "chunk_6"], (_, chunk) => {
        $.each(response[chunk].lists, (_, list) => {
            if (!list.isCustomList) {
                var status = list.status;
                $.each(list.entries, (_, entry) => {
                    var media = entry.media;
                    var mediaType;
                    if (media.format === "MUSIC" || media.format === "NOVEL" || media.format === "MOVIE") {
                        mediaType = media.format;
                    } else if (media.format === "SPECIAL" || media.format === "OVA") {
                        mediaType = "SPECIAL";
                    } else {
                        mediaType = media.type;
                    }
                    output[mediaType][status].push({
                        title: media.title.userPreferred,
                        site: media.siteUrl,
                        id: media.id,
                        cover: {
                            large: media.coverImage.large,
                            small: media.coverImage.medium,
                        },
                    });
                });
            }
        });
    });
    return output;
}

function fetchAndDisplayListsContent(type) {
    var anime_cache = localStorage.getItem($.state.session_anime_list_cache_id);
    var manga_cache = localStorage.getItem($.state.session_manga_list_cache_id);

    if (type === "ANIME" && anime_cache && USE_CACHE) {
        anime_cache = JSON.parse(anime_cache);
        displayListsContent("ANIME", anime_cache.ANIME);
        displayListsContent("MUSIC", anime_cache.MUSIC);
        displayListsContent("MOVIE", anime_cache.MOVIE);
        displayListsContent("SPECIAL", anime_cache.SPECIAL);
        fetchAndDisplayListsContent("MANGA");
        return;
    }
    if (type === "MANGA" && manga_cache && USE_CACHE) {
        manga_cache = JSON.parse(manga_cache);
        displayListsContent("MANGA", manga_cache.MANGA);
        displayListsContent("NOVEL", manga_cache.NOVEL);
        return;
    }
    $.ajax({
        url: "https://graphql.anilist.co",
        method: "POST",
        timeout: 40000,
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: "Bearer " + $.state.session_token,
        },
        data: JSON.stringify({
            query: $.state.media_lists_graphql,
            variables: {
                userid: $.state.session_id,
                mediatype: type,
            },
        }),
        error: () => {
            setTimeout(() => {
                fetchAndDisplayListsContent(type);
            }, 10000);
        },
        success: (response) => {
            var processedResponse = processListsContent(response.data);
            if (type === "ANIME") {
                displayListsContent("ANIME", processedResponse.ANIME);
                displayListsContent("MUSIC", processedResponse.MUSIC);
                displayListsContent("MOVIE", processedResponse.MOVIE);
                displayListsContent("SPECIAL", processedResponse.SPECIAL);
                fetchAndDisplayListsContent("MANGA");
                if (USE_CACHE) {
                    localStorage.setItem($.state.session_anime_list_cache_id, JSON.stringify(processedResponse));
                }
            } else {
                displayListsContent("MANGA", processedResponse.MANGA);
                displayListsContent("NOVEL", processedResponse.NOVEL);
                if (USE_CACHE) {
                    localStorage.setItem($.state.session_manga_list_cache_id, JSON.stringify(processedResponse));
                }
            }
        },
    });
}

function viewListsCategory(category) {
    var loading = $.attribute("data-lists-cetegory", category).attr("data-is-loading") === "true";
    if (loading) {
        makeNotification("Fetching Data !");
        return;
    }
    $.state.selected_list_category = category;
    $.each(["CURRENT", "PLANNING", "COMPLETED", "DROPPED", "PAUSED", "REPEATING"], (_, status) => {
        $.id("[M]-lists.count@" + status).html(String($.attribute("category-status-id", category + "." + status).length).replace(/0/g, "O"));
    });
    $.id("[M]-lists").attr("data-current-lists-section", "status");
    $.id("[M]-lists.status_selection_text").html(category);
}

function backToListsCategoryFromStatus() {
    $.id("[M]-lists").attr("data-current-lists-section", "categories");
}

function backToListsStatusFromMedia() {
    $.id("[M]-lists").attr("data-current-lists-section", "status");
}

function viewListsMedia(status) {
    var stacked = $.id("[M]-lists.mediaContent.stacked");
    var grids = $.id("[M]-lists.mediaContent.grids");

    $.state.selected_list_status = status;

    stacked.attr("data-seleceted-list-to-view", $.state.selected_list_category + "-" + status);
    grids.attr("data-seleceted-list-to-view", $.state.selected_list_category + "-" + status);

    setTimeout(() => {
        $.id("[M]-lists").attr("data-current-lists-section", "media");
    }, 100);
}

function viewListsGridMoreInfo(id) {
    var element = $.attribute("list-grid-section-id", id);
    if ($.state.last_list_grid_more_info === id) {
        element.attr("data-more-info-visible", "false");
        $.state.last_list_grid_more_info = undefined;
        return;
    }
    element.attr("data-more-info-visible", "true");
    if ($.state.last_list_grid_more_info) {
        $.attribute("list-grid-section-id", $.state.last_list_grid_more_info).attr("data-more-info-visible", "false");
    }
    $.state.last_list_grid_more_info = id;
}

