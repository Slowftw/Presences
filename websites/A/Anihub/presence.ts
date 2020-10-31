const presence = new Presence({
    clientId: "715045665796915250"
  }),
  browsingStamp = Math.floor(Date.now() / 1000),
  config = {
    paths: {
      watch: "/videos",
      profile: "/perfil",
      anime: "/anime",
      social: "/postagens",
      forum: "/forum",
      history: "/minha-lista",
      newtopic: "/novo-topico",
      room: "/sala"
    },
    ids: {
      videos: {
        this: "videos",
        name: "v_name",
        episode: "v_episode",
        lefttime: "v_lefttime",
        comment: "v_comment",
        report: "v_report"
      },
      anime: {
        this: "anime",
        name: "a_name",
        review: "a_review",
        trailer: "a_trailer",
        selection: "a_selection"
      },
      forum: {
        this: "forum",
        title: "f_title",
        category: "f_category",
        newtopic: "f_newtopic",
        reply: "f_reply"
      },
      profile: {
        this: "profile",
        username: "p_username",
        selection: "p_selection"
      },
      social: {
        this: "social",
        title: "s_title"
      },
      room: {
        this: "room",
        episode: "r_episode",
        name: "r_name",
        users: "r_users",
        lefttime: "r_lefttime"
      }
    }
  };
function MediaTimestamps(mediaTimes: number, mediaDuration: number): number[] {
  const startTime = Math.floor(Date.now() / 1000),
    endTime = Math.floor(startTime - mediaTimes + mediaDuration);
  return [startTime, endTime];
}
function NotFound(): boolean {
  const q = document.querySelector("#content>div>div>h1");
  if (window.location.pathname == "/404") return true;
  else if (q) if (q.textContent == "Página não encontrada!") return true;
  return false;
}
enum ResourceNames {
  logo = "logo_shadow",
  play = "play",
  pause = "pause",
  stop = "stop",
  search = "search",
  writing = "writing",
  reading = "reading",
  info = "info",
  group = "group"
}
presence.on("UpdateData", async () => {
  const data: PresenceData = {
      largeImageKey: ResourceNames.logo,
      startTimestamp: browsingStamp
    },
    pathName = window.location.pathname,
    video = document.querySelector("video");
  if (
    pathName.startsWith(config.paths.watch) &&
    (await presence.getSetting(config.ids.videos.this)) &&
    !NotFound()
  ) {
    const value = ["...", "..."],
      animeNameEP = document.querySelector("#main>article>h1"),
      comment = document.querySelector("textarea"),
      report = document.querySelector("div.modal-header>h1"),
      genders = document.querySelectorAll("div.autofill>span")[1];
    let timestamps: number[] = [];
    if (animeNameEP) {
      value[0] = animeNameEP.textContent.replace(
        animeNameEP.textContent.match(/ - \d+/g).slice(-1)[0],
        ""
      );
      value[1] = animeNameEP.textContent
        .match(/ - \d+/g)
        .slice(-1)[0]
        .match(/\d+/g)[0];
    }
    if (video && !isNaN(video.duration)) {
      timestamps = MediaTimestamps(video.currentTime, video.duration);
      if (await presence.getSetting(config.ids.videos.lefttime)) {
        if (!video.paused && video.readyState >= 1) {
          data.startTimestamp = timestamps[0];
          data.endTimestamp = timestamps[1];
          data.smallImageKey = ResourceNames.play;
        } else if (video.readyState >= 1)
          data.smallImageKey = ResourceNames.pause;
      }
    } else if (await presence.getSetting(config.ids.videos.lefttime))
      data.smallImageKey = ResourceNames.stop;
    data.details = value[0];
    data.state = `Episódio ${value[1]}`;
    if (genders && !genders.textContent.toLowerCase().includes("carregando"))
      data.smallImageText = genders.textContent;
    if (!(await presence.getSetting(config.ids.videos.name))) {
      data.details = "Assistindo Anime:";
      delete data.smallImageText;
    }
    if (!(await presence.getSetting(config.ids.videos.episode))) {
      delete data.state;
      data.details = data.details.replace(":", "");
    }
    if (
      (await presence.getSetting(config.ids.videos.report)) &&
      report &&
      report.textContent.toLowerCase().includes("relatando")
    ) {
      data.smallImageKey = ResourceNames.info;
      data.smallImageText = "Reportando...";
    } else if (
      (await presence.getSetting(config.ids.videos.comment)) &&
      comment &&
      comment.textLength > 0
    ) {
      data.smallImageKey = ResourceNames.writing;
      data.smallImageText = "Comentando...";
    }
    if (
      !data.state &&
      (await presence.getSetting(config.ids.videos.name)) &&
      !(await presence.getSetting(config.ids.videos.episode))
    ) {
      data.details = "Assistindo Anime:";
      data.state = value[0];
    }
    if (
      (await presence.getSetting(config.ids.videos.lefttime)) &&
      video &&
      !isNaN(video.duration) &&
      timestamps[0] == timestamps[1]
    ) {
      data.details = data.details.replace(/^/, "✔ ");
      data.smallImageKey = ResourceNames.stop;
    }
  } else if (
    pathName.startsWith(config.paths.profile) &&
    (await presence.getSetting(config.ids.profile.this)) &&
    !NotFound()
  ) {
    const title = ["Visualizando Perfil", "..."],
      username = document.querySelector("h1>b>font"),
      selected = document.querySelector(
        "#main > div.black.flexContent.subNav.p1 > a.btn.router-link-active"
      ),
      selfUsername = document.querySelector("#menu-links>ul>li>div>div>li>a");
    if (
      pathName.startsWith(config.paths.profile) &&
      pathName.includes("/editar") &&
      selfUsername &&
      username.textContent.toLowerCase() ==
        selfUsername.getAttribute("href").split("/").slice(-1)[0].toLowerCase()
    )
      title[0] = "Editando Perfil";
    title[1] = username ? username.textContent : "...";
    if (selected && (await presence.getSetting(config.ids.profile.selection)))
      title[0] += ` - ${selected.childNodes[1].textContent.trim()}`;
    data.details = title[0];
    data.state = title[1];
    if (!(await presence.getSetting(config.ids.profile.username))) {
      delete data.state;
      data.details = title[0].replace(":", "");
    } else data.details += ":";
  } else if (
    pathName.startsWith(config.paths.forum) &&
    (await presence.getSetting(config.ids.forum.this)) &&
    !NotFound()
  ) {
    const Thread = document.getElementsByClassName("thread")[0],
      ThreadTitle = document
        .querySelector("head>title")
        .textContent.replace(" - Tópico", ""),
      NonThread = document.querySelector("#main>article>div>h1>b");
    if (
      pathName.split("/").join("") == config.paths.forum.split("/").join("")
    ) {
      data.details = "Fórum";
      if (await presence.getSetting(config.ids.forum.category)) {
        data.state = "Categorias";
        data.smallImageKey = ResourceNames.search;
      }
    } else if (Thread) {
      data.details = (await presence.getSetting(config.ids.forum.category))
        ? `Fórum - ${
            Thread.parentElement.firstChild.textContent.match(/\[(.*?\])/)[0]
          }`
        : "Fórum";
      const ThreadAuthor = document.querySelector(
          "div.flexContent.thread>div>div>a"
        ).textContent,
        textarea = document.querySelector("div.chill.fill");
      if (await presence.getSetting(config.ids.forum.title)) {
        data.state = `${ThreadAuthor}: ${ThreadTitle}`;
        data.smallImageKey = ResourceNames.reading;
        data.smallImageText = `Thread Id: ${Thread.getAttribute("id").replace(
          "t",
          ""
        )}`;
      }
      if (
        textarea &&
        textarea.textContent.length > 0 &&
        (await presence.getSetting(config.ids.forum.reply))
      ) {
        data.smallImageKey = ResourceNames.writing;
        data.smallImageText = "Respondendo...";
      }
    } else if (!pathName.endsWith(config.paths.newtopic)) {
      data.details = "Fórum";
      if (await presence.getSetting(config.ids.forum.category)) {
        data.state = `Categoria: ${NonThread.childNodes[
          NonThread.childNodes.length - 1
        ].textContent.replace(/^\s+|\s+$/g, "")}`;
        data.smallImageKey = ResourceNames.search;
      }
    } else {
      data.details = "Fórum";
      if (await presence.getSetting(config.ids.forum.newtopic)) {
        data.details += " - [Novo Tópico]";
        const category = document.querySelector("select"),
          selectedCategory =
            category.options[category.selectedIndex].textContent;
        if (await presence.getSetting(config.ids.forum.category))
          data.state = `Categoria: ${
            isNaN(parseInt(selectedCategory)) ? selectedCategory : "..."
          }`;
        data.smallImageKey = ResourceNames.writing;
      }
    }
  } else if (
    pathName.startsWith(config.paths.social) &&
    (await presence.getSetting(config.ids.social.this)) &&
    !NotFound()
  ) {
    const title = document.querySelector("head>title").textContent;
    data.details = isNaN(parseInt(pathName.split("/").slice(-1)[0]))
      ? "Visualizando Publicações"
      : "Visualizando Postagem";
    if (
      !isNaN(parseInt(pathName.split("/").slice(-1)[0])) &&
      (await presence.getSetting(config.ids.social.title))
    ) {
      data.details += ":";
      data.state = title;
      data.smallImageText = `Post Id: ${pathName.split("/").slice(-1)[0]}`;
    }
    data.smallImageKey = ResourceNames.reading;
  } else if (
    pathName.startsWith(config.paths.anime) &&
    !pathName.startsWith(config.paths.anime + "s") &&
    (await presence.getSetting(config.ids.anime.this)) &&
    !NotFound()
  ) {
    const animeName = document.querySelector("h1>b"),
      modal = document.querySelector("div.modal-header>h1"),
      selected = document.querySelector("a.p1.din.router-link-exact-active");
    document.querySelectorAll("div.aniinfos>span").forEach((item) => {
      if (item.previousElementSibling.textContent.includes("Gêneros")) {
        data.smallImageKey = ResourceNames.search;
        data.smallImageText = item.textContent;
      }
    });

    if (await presence.getSetting(config.ids.anime.review)) {
      if (modal && modal.textContent.toLowerCase().includes("resenha"))
        selected && (await presence.getSetting(config.ids.anime.selection))
          ? (data.details = `Criando Resenha - ${selected.textContent}:`)
          : (data.details = `Criando Resenha:`);
    }
    if (await presence.getSetting(config.ids.anime.trailer)) {
      if (modal && modal.textContent.toLowerCase().includes("trailer"))
        selected && (await presence.getSetting(config.ids.anime.selection))
          ? (data.details = `Assistindo Trailer - ${selected.textContent}:`)
          : (data.details = `Assistindo Trailer:`);
    }
    if (!data.details)
      selected && (await presence.getSetting(config.ids.anime.selection))
        ? (data.details = `Visualizando Anime - ${selected.textContent}:`)
        : (data.details = `Visualizando Anime:`);
    if (await presence.getSetting(config.ids.anime.name))
      data.state = animeName ? animeName.textContent : "...";
    else {
      data.details = data.details.replace(":", "");
      delete data.smallImageText;
    }
  } else if (
    pathName.startsWith(config.paths.room) &&
    (await presence.getSetting(config.ids.room.this))
  ) {
    const usersCount = document.querySelector("#main>article>div>div>b"),
      animeNameEP = document.querySelector("#main>article>h1");
    let timestamps: number[] = [];
    const value = ["...", "..."];
    if (animeNameEP) {
      value[0] = animeNameEP.textContent.replace(
        animeNameEP.textContent.match(/ - \d+/g).slice(-1)[0],
        ""
      );
      value[1] = animeNameEP.textContent
        .match(/ - \d+/g)
        .slice(-1)[0]
        .match(/\d+/g)[0];
    }
    data.details = !(await presence.getSetting(config.ids.room.name))
      ? "Assistindo em Grupo:"
      : value[0];
    data.state = `Episódio ${value[1]}`;
    data.smallImageKey = ResourceNames.group;
    if (usersCount && (await presence.getSetting(config.ids.room.users)))
      data.smallImageText =
        usersCount.textContent.split(" ")[0] == "1"
          ? "Assistindo sozinho(a)"
          : `Assistindo com ${
              parseInt(usersCount.textContent.split(" ")[0]) - 1
            } usuário(s)`;
    else if (
      !(await presence.getSetting(config.ids.room.users)) &&
      (await presence.getSetting(config.ids.room.name))
    )
      data.smallImageText = "Assistindo em Grupo";
    if (
      video &&
      !isNaN(video.duration) &&
      (await presence.getSetting(config.ids.room.lefttime))
    ) {
      timestamps = MediaTimestamps(video.currentTime, video.duration);
      if (!video.paused && video.readyState >= 1) {
        data.startTimestamp = timestamps[0];
        data.endTimestamp = timestamps[1];
      }
    }
    if (!(await presence.getSetting(config.ids.room.episode)))
      delete data.state;
    if (
      !(await presence.getSetting(config.ids.room.episode)) &&
      !(await presence.getSetting(config.ids.room.name))
    ) {
      delete data.state;
      data.details = data.details.replace(":", "");
    }
  } else if (!NotFound()) {
    try {
      const pathsAndStrings = [
          "/login=Logando",
          "/registro=Registrando...",
          "/changelogs=Changelogs",
          "/loja=Loja",
          "/caixa-da-sorte",
          "/politica=Políticas do Site",
          "/equipe-membros=Membros da Equipe",
          "/conquistas=Lista de Conquistas",
          "/animes=Lista de Animes"
        ],
        customPaths: string = await presence.getSetting("customPaths"),
        pathsFromCustom = eval(
          `[${customPaths.toLowerCase().replace(/[\s\n]+/g, "")}]`
        );
      pathsAndStrings.forEach((item: string) => {
        const splitItem = item.split("=");
        if (
          pathName.startsWith(splitItem[0]) &&
          pathsFromCustom.indexOf(splitItem[0]) != -1
        )
          data.details = splitItem[1];
        if (pathName == "/" && pathsFromCustom.indexOf("/") != -1)
          data.details = "Início";
      });
    } catch (err) {
      data.details = "ERROR";
    }
  }
  presence.setActivity(data);
});
