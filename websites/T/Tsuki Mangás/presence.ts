const presence = new Presence({
    clientId: "777623145301016596"
  }),
  browsingStamp = Math.floor(Date.now() / 1000),
  settings = {
    id: {
      home: {
        this: "home",
        releases: "releases",
        str: "h_str"
      },
      mangalist: {
        this: "mangalist",
        gender: "ml_gender",
        pagination: "ml_pagi",
        str: "ml_str"
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
        reply_user: "r_reply_user",
        str: "r_str"
      },
      manga: {
        this: "manga",
        name: "m_name",
        tab: "m_tab",
        gender: "m_gender",
        pagination: "m_pagi",
        str: "m_str"
      },
      profile: {
        this: "profile",
        username_and_tab: "p_username_and_tab",
        editing: "p_editing",
        str: "p_str"
      },
      group_scan: {
        this: "group_scan",
        name: "gs_name",
        members: "gs_members",
        pagination: "gs_pagi",
        str: "gs_str"
      },
      search: {
        this: "search",
        input: "s_input",
        str: "s_str"
      },
      history: {
        this: "history",
        str: "hi_str"
      },
      notify: {
        this: "notify",
        str: "no_str"
      },
      dark: "darkbackground",
      custom_: "custom_",
      custom: "custom",
      timestamp: "timestamp"
    },
    ph: {
      h_lancamento: function (s: string) {
        const query = document.querySelector("[class*=activedlanca]");
        return s.split("%h_l%").join(query ? query.textContent : "%ph_bruh%");
      },
      pagination: function (s: string) {
        return s
          .split("%pagi0%")
          .join(getPagination(0)[0].toString())
          .split("%pagi1%")
          .join(getPagination(0)[1].toString())
          .split("%pagi0_%")
          .join(getPagination(0, true)[0].toString())
          .split("%pagi1_%")
          .join(getPagination(0, true)[1].toString());
      },
      url_search: function (s: string) {
        return s
          .split("%url_s%")
          .join(decodeURIComponent(window.location.search.slice(1)));
      }
    }
  },
  imgKeys = [
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
  if (value.startsWith("!")) return value.slice(1);
  if (imgKeys.indexOf(value) < 0) return "";
  if (await presence.getSetting(settings.id.dark)) value += "_dark";
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
function getUser(myUser?: boolean): string {
  const title_regex = document.title.match(/(?<=Perfil: )(.*)(?= -)/g),
    query = document.querySelector("ul.drop_menu>a"),
    dom = document.querySelector("#capapl > b")?.textContent,
    pathname = /\/perfil\/(\w+)\/{0,}/g.exec(location.pathname);
  if (myUser)
    return query?.hasAttribute("href")
      ? query.getAttribute("href").split("/").slice(-1)[0]
      : "%ph_bruh%";
  return dom
    ? dom
    : title_regex
    ? title_regex[0]
    : pathname
    ? pathname[1]
    : "%ph_bruh%";
}
async function getStrings(id: string): Promise<string[]> {
  let arr: string[] = [];
  try {
    arr = eval(`[${await presence.getSetting(id)}]`);
    arr = arr.filter((i: string) => typeof i === "string");
  } catch {
    return [];
  }
  return arr;
}
function getAllPH(input: string): string {
  for (const item in settings.ph)
    input = (settings.ph as Record<string, (s: string) => string>)[item](input);
  return input;
}
function getStats(query: string): string {
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
  const pathname = window.location.pathname,
    notfound = pathname == "/404" || document.querySelector(".notfound"),
    timestampValue: number = await presence.getSetting(settings.id.timestamp),
    data: PresenceData = {
      largeImageKey: await Resource(imgKeys[0]),
      startTimestamp:
        timestampValue == 0
          ? browsingStamp
          : timestampValue == 1
          ? Math.floor(Date.now() / 1000)
          : timestampValue == 3
          ? undefined
          : -1
    };
  if (
    pathname == "/" &&
    (await presence.getSetting(settings.id.home.this)) &&
    (await getStrings(settings.id.home.str)).length >= 3
  ) {
    const str = await getStrings(settings.id.home.str);
    data.details = str[1];
    if (await presence.getSetting(settings.id.home.releases))
      data.state = settings.ph
        .h_lancamento(str[2])
        .replace("%ph_bruh%", str[0]);
  } else if (
    pathname.startsWith("/lista-mangas") &&
    !notfound &&
    (await presence.getSetting(settings.id.mangalist.this)) &&
    (await getStrings(settings.id.mangalist.str)).length >= 4
  ) {
    const genders: string[] = [],
      gendersEnabled = await presence.getSetting(settings.id.mangalist.gender),
      pagiEnabled = await presence.getSetting(settings.id.mangalist.pagination),
      str = await getStrings(settings.id.mangalist.str);
    data.details = str[0];
    if (pagiEnabled) data.details += settings.ph.pagination(str[1]);
    if (gendersEnabled) {
      document
        .querySelector("div.multiselect>div>div")
        ?.childNodes.forEach((item) => {
          genders.push(item.textContent.trim());
        });
      data.state = genders.length > 2 ? "" : str[2];
      if (genders.length == 0) data.state += str[3];
      data.state += genders.join(", ");
    }
  } else if (
    pathname.startsWith("/leitor/") &&
    !notfound &&
    (await presence.getSetting(settings.id.reader.this))
  ) {
    const overlay = getWoMaterialIcons(".bmod>h3"),
      name = document.querySelector(".f20"),
      chapter = document.querySelector(".f14c"),
      page = document.querySelector(".noselect>.backgsla"),
      pageType = document.querySelector(".bblc>select"),
      nameEnabled = await presence.getSetting(settings.id.reader.name),
      chapterEnabled = await presence.getSetting(settings.id.reader.chapter),
      pageEnabled = await presence.getSetting(settings.id.reader.page),
      reportEnabled = await presence.getSetting(settings.id.reader.report),
      commentEnabled = await presence.getSetting(settings.id.reader.comment),
      titleEnabled = await presence.getSetting(settings.id.reader.title),
      replyEnabled = await presence.getSetting(settings.id.reader.reply),
      replyUEnabled = await presence.getSetting(settings.id.reader.reply_user);
    data.details = nameEnabled
      ? name && name.textContent.trim()
        ? name.textContent.trim()
        : "..."
      : "Lendo Mangá:";
    data.state = "";
    data.smallImageKey = await Resource(imgKeys[1]);
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
      data.smallImageKey = await Resource(imgKeys[5]);
      data.smallImageText = "Reportando capítulo...";
    } else if (
      commentEnabled &&
      document.activeElement.nodeName == "TEXTAREA" &&
      document.activeElement.parentElement.parentElement.className == "comentll"
    ) {
      data.smallImageKey = await Resource(imgKeys[3]);
      data.smallImageText = "Comentando...";
    } else if (
      replyEnabled &&
      document.activeElement.nodeName == "INPUT" &&
      document.activeElement.parentElement.parentElement.className == "kkl"
    ) {
      data.smallImageKey = await Resource(imgKeys[7]);
      data.smallImageText = `Respondendo ${
        replyUEnabled
          ? document.activeElement.parentElement.parentElement.querySelector(
              ".comentrig>a>a"
            ).textContent
          : "comentário..."
      }`;
    }
  } else if (
    pathname.startsWith("/manga/") &&
    !notfound &&
    (await presence.getSetting(settings.id.manga.this))
  ) {
    const m_name = document.querySelector(".tity>h2>b"),
      gendersQuery = document.querySelectorAll(".gencl"),
      tab = document.querySelector(".ativoman"),
      genders: string[] = [],
      nameEnabled = await presence.getSetting(settings.id.manga.name),
      gendersEnabled = await presence.getSetting(settings.id.manga.gender),
      tabEnabled = await presence.getSetting(settings.id.manga.tab),
      pagiEnabled = await presence.getSetting(settings.id.manga.pagination);
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
      data.state = genders.length > 2 ? "" : "Gêneros: ";
      data.state += genders.join(", ");
    }
    data.smallImageKey = await Resource(imgKeys[2]);
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
    pathname.startsWith("/perfil/") &&
    !notfound &&
    (await presence.getSetting(settings.id.profile.this))
  ) {
    const username = getUser(),
      tab = getWoMaterialIcons(".titleboxmanga")?.textContent.trim(),
      pathEditing =
        pathname.replace(/\/$/, "").split("/").slice(-1)[0] == "editar";
    data.details = "Visualizando Perfil:";
    if (
      !pathEditing &&
      (await presence.getSetting(settings.id.profile.username_and_tab))
    ) {
      data.state = username ? username : "...";
      if (document.querySelector(".allmangasperfil"))
        data.state += " - Visão geral";
      if (document.querySelectorAll(".allmangasperfil").length == 1 && tab) {
        data.state = data.state.replace(" - Visão geral", "");
        switch (tab) {
          case "Terminei de Ler":
            data.state += ` - Completos (${getStats("#completo")})`;
            break;
          case "Lendo":
            data.state += ` - ${tab} (${getStats("#lendo")})`;
            break;
          case "Pretende Ler":
            data.state += ` - ${tab} (${getStats("#pretendeler")})`;
            break;
          case "Dropados":
            data.state += ` - Desistiu (${getStats("#dropado")})`;
            break;
        }
      }
    } else if (
      pathEditing &&
      (await presence.getSetting(settings.id.profile.editing))
    ) {
      data.details = "Editando Perfil:";
      if (await presence.getSetting(settings.id.profile.username_and_tab))
        data.state = getUser();
    } else if (pathEditing) delete data.details;
    if (
      data.details &&
      !(await presence.getSetting(settings.id.profile.username_and_tab))
    )
      data.details = data.details.replace(/:$/, "");
  } else if (
    pathname.startsWith("/scan/") &&
    pathname != "/scan/" &&
    !notfound &&
    (await presence.getSetting(settings.id.group_scan.this))
  ) {
    const scanName = document.querySelector(".contentscan h2"),
      scanMembers = document.querySelectorAll(".membrosscan>.memleoa").length,
      nameEnabled = await presence.getSetting(settings.id.group_scan.name),
      membersEnabled = await presence.getSetting(
        settings.id.group_scan.members
      ),
      pagiEnabled = await presence.getSetting(
        settings.id.group_scan.pagination
      );
    data.details = "Grupo:";
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
  if (await presence.getSetting(settings.id.search.this)) {
    const searchElement = "#menu>li>input";
    if (
      (document.querySelector(searchElement) &&
        (document.activeElement.parentNode.parentNode as Element).id ==
          "menu" &&
        document.activeElement.className == "sch hh") ||
      document.querySelector(".dactive .boxsea")
    ) {
      if (await presence.getSetting(settings.id.search.input)) {
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
      data.smallImageKey = await Resource(imgKeys[2]);
      delete data.smallImageText;
    }
  } else if (
    (await presence.getSetting(settings.id.history.this)) &&
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
    data.details = "Histórico:";
    data.state = `${
      hCategory
        ? `${hCategory.match(/\d+/g)[0]} ${hCategory.replace(/ \d+/g, "")}`
        : "..."
    } - ${hSession}`;
    data.smallImageKey = await Resource(imgKeys[4]);
    data.smallImageText = `Pág. ${getPagination(0, true)[0]}/${
      getPagination(0, true)[1]
    }`;
  } else if (
    (await presence.getSetting(settings.id.notify.this)) &&
    parseInt(
      document.querySelector(`[class$="historicob 22"]`)?.parentElement.style
        .width
    ) > 0
  ) {
    data.details = "Notificações";
    data.smallImageKey = await Resource(imgKeys[6]);
    delete data.state;
    delete data.smallImageText;
  }
  if (await presence.getSetting(settings.id.custom_)) {
    if (isValidJSON(`{${await presence.getSetting(settings.id.custom)}}`)) {
      const jsonObj = await JSON.parse(
        `{${await presence.getSetting(settings.id.custom)}}`
      );
      for (const obj in jsonObj) {
        if (
          Array.isArray(jsonObj[obj]) &&
          pathname.match(new RegExp(obj, "g"))
        ) {
          for (let item in jsonObj[obj]) {
            item = jsonObj[obj][item];
            if (item.length > 1) {
              switch (jsonObj[obj].indexOf(item)) {
                case 0:
                  data.details = getAllPH(item);
                  break;
                case 1:
                  data.state = getAllPH(item);
                  break;
                case 2:
                  data.smallImageKey = await Resource(item);
                  break;
                case 3:
                  data.smallImageText = getAllPH(item);
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
  const _ = data as Record<string, string | number | undefined>,
    ZERO_WIDTH_NON_JOINER = "\u200C";
  if ((!data.details || !data.details.trim()) && data.startTimestamp == -1)
    presence.setActivity({ startTimestamp: browsingStamp });
  else {
    for (const i in data) {
      if (i == "largeImageKey" && (!_[i] || !_[i].toString().trim()))
        data.largeImageKey = (await Resource(imgKeys[0])) || imgKeys[0];
      else if (!_[i] || !_[i].toString().trim()) delete _[i];
      else if (isNaN(parseInt(_[i].toString())) && _[i].toString().length < 2)
        _[i] += ZERO_WIDTH_NON_JOINER;
    }
    presence.setActivity(data);
  }
  /*
  presence.info(
    `details: "${data.details}"\nstate: "${data.state}"\ntimestamp: ${data.startTimestamp}\nsmallKey: "${data.smallImageKey}"\nsmallText: "${data.smallImageText}"\nlargeKey: "${data.largeImageKey}"`
  );
  */
});
