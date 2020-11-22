const presence = new Presence({
    clientId: "777623145301016596"
  }),
  browsingStamp = Math.floor(Date.now() / 1000),
  SettingsId = {
    home: {
      this: "home",
      releases: "releases"
    },
    mangalist: {
      this: "mangalist",
      gender: "ml_gender",
      pagination: "ml_pagi"
    },
    reader: {
      this: "reader",
      name: "r_name",
      title: "r_title",
      chapter: "r_chapter",
      page: "r_page",
      report: "r_report",
      comment: "r_comment",
      reply: "r_reply",
      reply_user: "r_reply_user"
    },
    manga: {
      this: "manga",
      name: "m_name",
      tab: "m_tab",
      gender: "m_gender",
      pagination: "m_pagi"
    },
    profile: {
      this: "profile",
      username_and_tab: "p_username_and_tab",
      editing: "p_editing"
    },
    group_scan: {
      this: "group_scan",
      name: "gs_name",
      members: "gs_members",
      pagination: "gs_pagi"
    },
    search: {
      this: "search",
      input: "s_input"
    },
    history: "history",
    notify: "notify",
    dark: "darkbackground",
    custom_: "custom_",
    custom: "custom",
    timestamp: "timestamp"
  },
  imgNames = [
    "logo",
    "reading",
    "search",
    "writing",
    "history",
    "info",
    "bell",
    "reply"
  ];
async function Resource(ResourceSelected: string): Promise<string> {
  let value = ResourceSelected;
  if (value.match(/^!/)) return value.replace(/^!/, "");
  if (imgNames.indexOf(value) < 0) return "";
  if (await presence.getSetting(SettingsId.dark)) value += "_dark";
  return value.toLowerCase();
}
function getPagination(ind: number, history?: boolean): number[] {
  let current = 1,
    max = 1,
    pagination;
  !history
    ? (pagination = document.querySelectorAll(".coint .pagination")[ind])
    : (pagination = document.querySelectorAll(".pjhistorico .pagination")[ind]);
  if (pagination) {
    current = parseInt(pagination.querySelector(".active")?.textContent);
    if (isNaN(current)) current = 1;
    pagination.querySelectorAll("li").forEach((item) => {
      if (
        !isNaN(parseInt(item.textContent)) &&
        parseInt(item.textContent) > max
      )
        max = parseInt(item.textContent);
    });
  }
  return [current, max];
}
function placeholder(input: string): string {
  return input.split("%s%").join(decodeURIComponent(location.search.slice(1)));
}
function p_getStatistics(query: string): string {
  return (document.querySelector(query) as HTMLElement)?.dataset.tooltip;
}
function getWoMaterialIcons(query: string) {
  const i = document.querySelector(query),
    duplicate = i?.cloneNode(true);
  (duplicate as Element)?.querySelector("i.material-icons").remove();
  return duplicate;
}
function isValidJSON(text: string): boolean {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}
presence.on("UpdateData", async () => {
  const pathName = window.location.pathname,
    notfound = pathName == "/404" || document.querySelector(".notfound"),
    timestampValue = await presence.getSetting(SettingsId.timestamp),
    data: PresenceData = {
      largeImageKey: await Resource(imgNames[0]),
      startTimestamp:
        timestampValue == 0
          ? browsingStamp
          : timestampValue == 1
          ? Math.floor(Date.now() / 1000)
          : undefined
    };
  if (pathName == "/" && (await presence.getSetting(SettingsId.home.this))) {
    data.details = "Início";
    if (await presence.getSetting(SettingsId.home.releases)) {
      const a = document.querySelector("[class*=activedlanca]");
      data.state = "Lançamentos: " + (a ? a.textContent : "...");
    }
  } else if (
    pathName.startsWith("/lista-mangas") &&
    (await presence.getSetting(SettingsId.mangalist.this)) &&
    !notfound
  ) {
    data.details = "Lista de Mangás";
    if (await presence.getSetting(SettingsId.mangalist.pagination))
      data.details += ` - ${getPagination(0)[0]}/${getPagination(0)[1]}`;
    if (await presence.getSetting(SettingsId.mangalist.gender)) {
      let Generos = "";
      document
        .querySelector("div.multiselect>div>div")
        ?.childNodes.forEach((item) => {
          if (Generos) Generos += ", ";
          Generos += item.textContent.trim();
        });
      data.state = `Gêneros: ${!Generos ? "Todos" : Generos}`;
    }
  } else if (
    pathName.startsWith("/perfil/") &&
    !notfound &&
    (await presence.getSetting(SettingsId.profile.this))
  ) {
    const username = document.querySelector("#capapl > b")?.textContent,
      tab = getWoMaterialIcons(".titleboxmanga")?.textContent.trim(),
      pathEditing =
        pathName.replace(/\/$/, "").split("/").slice(-1)[0] == "editar";
    data.details = "Visualizando Perfil:";
    if (
      !pathEditing &&
      (await presence.getSetting(SettingsId.profile.username_and_tab))
    ) {
      data.state = username ? username : "...";
      if (document.querySelector(".allmangasperfil"))
        data.state += " - Visão geral";
      if (document.querySelectorAll(".allmangasperfil").length == 1 && tab) {
        data.state = data.state.replace(" - Visão geral", "");
        switch (tab) {
          case "Terminei de Ler":
            data.state += ` - Completos (${p_getStatistics("#completo")})`;
            break;
          case "Lendo":
            data.state += ` - ${tab} (${p_getStatistics("#lendo")})`;
            break;
          case "Pretende Ler":
            data.state += ` - ${tab} (${p_getStatistics("#pretendeler")})`;
            break;
          case "Dropados":
            data.state += ` - Desistiu (${p_getStatistics("#dropado")})`;
            break;
        }
      }
    } else if (
      pathEditing &&
      (await presence.getSetting(SettingsId.profile.editing))
    ) {
      data.details = "Editando Perfil:";
      if (await presence.getSetting(SettingsId.profile.username_and_tab)) {
        const userTitle = document
          .querySelector("head>title")
          .textContent.match(/(?<=Perfil: )(.*)(?= -)/g);
        if (userTitle) data.state = userTitle[0];
        else {
          const hrefUser = document
            .querySelector("ul.drop_menu>a")
            .getAttribute("href");
          if (hrefUser) data.state = hrefUser.split("/").slice(-1)[0];
        }
      }
    } else if (pathEditing) delete data.details;
    if (
      data.details &&
      !(await presence.getSetting(SettingsId.profile.username_and_tab))
    )
      data.details = data.details.replace(/:$/, "");
  } else if (
    pathName.startsWith("/manga/") &&
    !notfound &&
    (await presence.getSetting(SettingsId.manga.this))
  ) {
    const m_name = document.querySelector(".tity>h2>b"),
      gendersQuery = document.querySelectorAll(".gencl"),
      tab = document.querySelector(".ativoman"),
      genders: string[] = [],
      nameEnabled = await presence.getSetting(SettingsId.manga.name),
      gendersEnabled = await presence.getSetting(SettingsId.manga.gender),
      tabEnabled = await presence.getSetting(SettingsId.manga.tab),
      pagiEnabled = await presence.getSetting(SettingsId.manga.pagination);
    data.details = nameEnabled
      ? m_name && m_name.textContent.trim()
        ? m_name.textContent.trim()
        : "..."
      : "Visualizando Mangá:";
    data.state = "...";
    if (gendersEnabled && gendersQuery.length != 0) {
      gendersQuery.forEach((item) => {
        genders.push(item.textContent.trim());
      });
      data.state = genders.length > 2 ? "" : "Gênero(s): ";
      data.state += genders.join(", ");
    }
    data.smallImageKey = await Resource(imgNames[2]);
    data.smallImageText = "";
    if (tabEnabled)
      data.smallImageText =
        tab && tab.textContent.trim() ? tab.textContent.trim() : "...";
    if (pagiEnabled)
      data.smallImageText += ` - ${getPagination(0)[0]}/${getPagination(0)[1]}`;
    if (pagiEnabled && !tabEnabled)
      data.smallImageText = data.smallImageText.replace(/^ - /, "");
    if (nameEnabled && !gendersEnabled) {
      data.state = data.details;
      data.details = "Visualizando Mangá:";
    }
    if (!nameEnabled && !gendersEnabled) {
      data.details = "Visualizando Mangá";
      delete data.state;
    }
  } else if (
    pathName.startsWith("/leitor/") &&
    !notfound &&
    (await presence.getSetting(SettingsId.reader.this))
  ) {
    const overlay = getWoMaterialIcons(".bmod>h3"),
      name = document.querySelector(".f20"),
      chapter = document.querySelector(".f14c"),
      page = document.querySelector(".noselect>.backgsla"),
      pageType = document.querySelector(".bblc>select"),
      nameEnabled = await presence.getSetting(SettingsId.reader.name),
      chapterEnabled = await presence.getSetting(SettingsId.reader.chapter),
      pageEnabled = await presence.getSetting(SettingsId.reader.page),
      reportEnabled = await presence.getSetting(SettingsId.reader.report),
      commentEnabled = await presence.getSetting(SettingsId.reader.comment),
      titleEnabled = await presence.getSetting(SettingsId.reader.title),
      replyEnabled = await presence.getSetting(SettingsId.reader.reply),
      replyUEnabled = await presence.getSetting(SettingsId.reader.reply_user);
    data.details = nameEnabled
      ? name && name.textContent.trim()
        ? name.textContent.trim()
        : "..."
      : "Lendo Mangá:";
    data.state = "";
    data.smallImageKey = await Resource(imgNames[1]);
    if (titleEnabled && chapter && chapter.querySelector("span"))
      data.smallImageText = `"${chapter
        .querySelector("span")
        .textContent.replace(/^ - /, "")}"`;
    if (chapterEnabled)
      if (chapter && chapter.textContent.trim())
        data.state += `Cap. ${
          chapter.childNodes[0].textContent.match(/\d+/g)[0]
        }`;
    if (pageEnabled)
      if (pageType)
        data.state += ` - Pág. ${
          page &&
          page.textContent.trim() &&
          (pageType as HTMLSelectElement).value == "false"
            ? (page as HTMLSelectElement).value
            : (pageType as HTMLSelectElement).value == "true"
            ? " abertas"
            : (data.state += " - ...")
        }`;
      else data.state += " - ...";
    else data.state = data.state.replace("Cap.", "Capítulo");
    if (!chapterEnabled && pageEnabled) {
      data.state = data.state.replace(/^ - /, "").replace("Pág.", "Página");
      if (data.state.includes("abertas"))
        data.state = data.state.replace("Página", "Páginas");
    }
    if (!nameEnabled && !chapterEnabled && !pageEnabled) {
      data.details = data.details.replace(/:$/, "");
      delete data.state;
    } else if (!chapterEnabled && !pageEnabled) {
      data.state = data.details;
      data.details = "Lendo Mangá:";
    }
    if (
      reportEnabled &&
      overlay &&
      overlay.textContent
        .trim()
        .split(" ")[0]
        .toLowerCase()
        .startsWith("report")
    ) {
      data.smallImageKey = await Resource(imgNames[5]);
      data.smallImageText = "Reportando capítulo...";
    } else if (
      commentEnabled &&
      document.activeElement.nodeName == "TEXTAREA" &&
      document.activeElement.parentElement.parentElement.className == "comentll"
    ) {
      data.smallImageKey = await Resource(imgNames[3]);
      data.smallImageText = "Comentando...";
    } else if (
      replyEnabled &&
      document.activeElement.nodeName == "INPUT" &&
      document.activeElement.parentElement.parentElement.className == "kkl"
    ) {
      data.smallImageKey = await Resource(imgNames[7]);
      data.smallImageText = `Respondendo ${
        replyUEnabled
          ? document.activeElement.parentElement.parentElement.querySelector(
              ".comentrig>a>a"
            ).textContent
          : "comentário..."
      }`;
    }
  } else if (
    pathName.startsWith("/scan/") &&
    pathName != "/scan/" &&
    !notfound &&
    (await presence.getSetting(SettingsId.group_scan.this))
  ) {
    const scanName = document.querySelector(".contentscan h2"),
      scanMembers = document.querySelectorAll(".membrosscan>.memleoa").length,
      nameEnabled = await presence.getSetting(SettingsId.group_scan.name),
      membersEnabled = await presence.getSetting(SettingsId.group_scan.members),
      pagiEnabled = await presence.getSetting(SettingsId.group_scan.pagination);
    data.details = "Visualizando Grupo:";
    data.state = "";
    if (nameEnabled)
      data.state =
        scanName && scanName.textContent.trim() ? scanName.textContent : "...";
    if (membersEnabled && scanMembers > 0)
      data.state += ` - ${scanMembers} Membros`;
    if (pagiEnabled)
      data.state += ` - Pág. ${getPagination(0)[0]}/${getPagination(0)[1]}`;
    data.state = data.state.replace(/^ - /, "");
    if (pagiEnabled && !nameEnabled && !membersEnabled)
      data.details = data.details.replace("Pág.", "Página");
    if (!data.state) data.details = data.details.replace(/:$/, "");
  }
  if (
    (await presence.getSetting(SettingsId.history)) &&
    parseInt(
      document.querySelector("[class$=historicob]")?.parentElement.style.width
    ) > 0
  ) {
    const hCategory = document
      .getElementsByClassName("activmancap")[0]
      ?.textContent.trim();
    let hSession = "...";
    document.querySelectorAll("div.selecths").forEach((item) => {
      if (item.classList[item.classList.length - 1].includes("selecths"))
        hSession = `${item.childNodes[0].textContent} ${item.childNodes[1].textContent}`;
    });
    data.details = "Visualizando Histórico:";
    data.state = `${
      hCategory
        ? `${hCategory.match(/\d+/g)[0]} ${hCategory.replace(/ \d+/g, "")}`
        : "..."
    } - ${hSession}`;
    data.smallImageKey = await Resource(imgNames[4]);
    data.smallImageText = `Pág. ${await getPagination(
      0,
      true
    )[0]}/${await getPagination(0, true)[1]}`;
  } else if (
    (await presence.getSetting(SettingsId.notify)) &&
    parseInt(
      document.querySelector(`[class$="historicob 22"]`)?.parentElement.style
        .width
    ) > 0
  ) {
    data.details = "Visualizando Notificações";
    data.smallImageKey = await Resource(imgNames[6]);
    delete data.state;
    delete data.smallImageText;
  } else if (await presence.getSetting(SettingsId.search.this)) {
    const searchElement = "#menu>li>input";
    if (
      (document.querySelector(searchElement) &&
        (document.activeElement.parentNode.parentNode as Element).id ==
          "menu" &&
        document.activeElement.className == "sch hh") ||
      document.querySelector(".dactive .boxsea")
    ) {
      if (await presence.getSetting(SettingsId.search.input)) {
        data.details = "Pesquisando:";
        data.state =
          (document.querySelector(searchElement) as HTMLInputElement).value
            .length > 1
            ? (document.querySelector(searchElement) as HTMLInputElement).value
            : "...";
      } else {
        data.details = "Pesquisando...";
        delete data.state;
      }
      data.smallImageKey = await Resource(imgNames[2]);
      delete data.smallImageText;
    }
  }
  if (await presence.getSetting(SettingsId.custom_)) {
    if (isValidJSON(`{${await presence.getSetting(SettingsId.custom)}}`)) {
      const jsonObj = await JSON.parse(
        `{${await presence.getSetting(SettingsId.custom)}}`
      );
      for (const obj in jsonObj) {
        if (
          Array.isArray(jsonObj[obj]) &&
          pathName.match(new RegExp(obj, "g"))
        ) {
          for (let item in jsonObj[obj]) {
            item = jsonObj[obj][item];
            if (item.length > 1) {
              switch (jsonObj[obj].indexOf(item)) {
                case 0:
                  data.details = placeholder(item);
                  break;
                case 1:
                  data.state = placeholder(item);
                  break;
                case 2:
                  data.smallImageKey = await Resource(item);
                  break;
                case 3:
                  data.smallImageText = placeholder(item);
                  break;
                case 4:
                  data.largeImageKey = await Resource(item);
                  break;
              }
            }
          }
        }
      }
    }
  }
  if (!data.state) delete data.state;
  if (!data.details) delete data.details;
  if (!data.startTimestamp) delete data.startTimestamp;
  if (!data.smallImageKey) delete data.smallImageKey;
  if (!data.smallImageText) delete data.smallImageText;
  if (!data.largeImageKey) data.largeImageKey = await Resource(imgNames[0]);
  /*
  console.log(
    `State: "${data.state}"\nDetails: "${data.details}"\ntimestamp: ${data.startTimestamp}\nsmallKey: ${data.smallImageKey}\nsmallText: "${data.smallImageText}"`
  );*/
  presence.setActivity(data);
});
