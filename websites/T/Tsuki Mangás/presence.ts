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
        format: "ml_format",
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
      timestamp: "timestamp",
      nodetails: "nodetails"
    },
    ph: {
      h_release: function (s: string, ph?: string) {
        const query = document.querySelector("[class*=activedlanca]");
        return s
          .split("%i.l%")
          .join(!s.includes("%i.l%") ? "" : query ? query.textContent : ph);
      },
      r_title: function (s: string) {
        return s
          .split("%l.titulo%")
          .join(
            !s.includes("%l.titulo%")
              ? ""
              : document
                  .querySelector(".f14c>span")
                  .textContent.replace(/^ - /, "")
          );
      },
      r_cap: function (s: string) {
        return s
          .split("%l.cap%")
          .join(
            !s.includes("%l.cap%")
              ? ""
              : document
                  .querySelector(".f14c")
                  .childNodes[0].textContent.match(/\d+/g)[0]
          );
      },
      r_pag: function (s: string, ph?: string[]) {
        const page = document.querySelector(".noselect>.backgsla"),
          pageType = document.querySelector(".bblc>select");
        return s
          .split("%l.pag%")
          .join(
            !page && !pageType
              ? ""
              : (pageType as HTMLSelectElement).value == "false"
              ? (page as HTMLSelectElement).value
              : (pageType as HTMLSelectElement).value == "true"
              ? ph[2]
              : ph[1] + ph[0]
          );
      },
      lc_format: function (s: string) {
        const format = document.querySelector(".multiselect__single");
        return s.split("%lc.f%").join(format ? format.textContent : "");
      },
      pagination: function (s: string) {
        return s
          .split("%pagi.0%")
          .join(getPagination(0)[0].toString())
          .split("%pagi.1%")
          .join(getPagination(0)[1].toString())
          .split("%hi.pagi.0%")
          .join(getPagination(0, true)[0].toString())
          .split("%hi.pagi.1%")
          .join(getPagination(0, true)[1].toString());
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
async function Resource(res: string): Promise<string> {
  if (res.startsWith("!")) return res.slice(1);
  if (imgKeys.indexOf(res) < 0) return "";
  if (await presence.getSetting(settings.id.dark)) res += "_dark";
  return res.toLowerCase();
}
function getPagination(ind: number, history?: boolean): number[] {
  let current = 1,
    max = 1;
  const pagination = !history
    ? document.querySelector(".coint .pagination")
      ? document.querySelectorAll(".coint .pagination")[ind]
      : null
    : document.querySelector(".pjhistorico .pagination")
    ? document.querySelectorAll(".pjhistorico .pagination")[ind]
    : null;
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
function getUser(ph: string, myUser?: boolean): string {
  const title_regex = document.title.match(/(?<=Perfil: )(.*)(?= -)/g),
    query = document.querySelector("ul.drop_menu>a"),
    dom = document.querySelector("#capapl > b")?.textContent,
    pathname = /\/perfil\/(\w+)\/{0,}/g.exec(location.pathname);
  if (myUser)
    return query?.hasAttribute("href")
      ? query.getAttribute("href").split("/").slice(-1)[0]
      : ph;
  return dom ? dom : title_regex ? title_regex[0] : pathname ? pathname[1] : ph;
}
async function getStrings(id: string): Promise<string[]> {
  let arr: string[] = [];
  try {
    arr = eval(`[${await presence.getSetting(id)}]`);
    arr = arr.filter((i: string) => typeof i == "string");
  } catch {
    return [];
  }
  return arr;
}
type phType = Record<string, (s: string, ph?: string | string[]) => string>;
function getAllPH(input: string): string {
  for (const item in settings.ph) input = (settings.ph as phType)[item](input);
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
    data: PresenceData = {
      largeImageKey: await Resource(imgKeys[0]),
      startTimestamp:
        (await presence.getSetting(settings.id.timestamp)) == 0
          ? browsingStamp
          : Math.floor(Date.now() / 1000)
    };
  if (
    pathname == "/" &&
    (await presence.getSetting(settings.id.home.this)) &&
    (await getStrings(settings.id.home.str)).length >= 3
  ) {
    const str = await getStrings(settings.id.home.str);
    data.details = str[1];
    if (await presence.getSetting(settings.id.home.releases))
      data.state = settings.ph.h_release(str[2], str[0]);
    data.buttons = [
      { label: "teste", url: "https://discord.com/users/325046217904226306/" }
    ];
  } else if (
    pathname.startsWith("/lista-completa") &&
    !notfound &&
    (await presence.getSetting(settings.id.mangalist.this)) &&
    (await getStrings(settings.id.mangalist.str)).length >= 5
  ) {
    const genders: string[] = [],
      _genders = await presence.getSetting(settings.id.mangalist.gender),
      _pagi = await presence.getSetting(settings.id.mangalist.pagination),
      _format = await presence.getSetting(settings.id.mangalist.format),
      str = await getStrings(settings.id.mangalist.str);
    data.details = !(document.querySelector(".multiselect__single") && _format)
      ? str[0]
      : settings.ph.lc_format(str[1]);
    if (_pagi) data.details += settings.ph.pagination(str[2]);
    if (_genders) {
      document
        .querySelector("div.multiselect>div>div")
        ?.childNodes.forEach((item) => {
          genders.push(item.textContent.trim());
        });
      data.state = genders.length > 2 ? "" : str[3];
      if (genders.length == 0) data.state += str[4];
      data.state += genders.join(", ");
    }
  } else if (
    pathname.startsWith("/leitor/") &&
    !notfound &&
    (await presence.getSetting(settings.id.reader.this))
  ) {
    const //overlay = getWoMaterialIcons(".bmod>h3"),
      name = document.querySelector(".f20"),
      chapter = document.querySelector(".f14c"),
      pageType = document.querySelector(".bblc>select"),
      _name = await presence.getSetting(settings.id.reader.name),
      _chapter = await presence.getSetting(settings.id.reader.chapter),
      _page = await presence.getSetting(settings.id.reader.page),
      //_report = await presence.getSetting(settings.id.reader.report),
      //_comment = await presence.getSetting(settings.id.reader.comment),
      _title = await presence.getSetting(settings.id.reader.title),
      //_reply = await presence.getSetting(settings.id.reader.reply),
      //_replyU = await presence.getSetting(settings.id.reader.reply_user),
      str = await getStrings(settings.id.reader.str);
    data.details = _name
      ? name && name.textContent.trim()
        ? name.textContent.trim()
        : str[0]
      : str[7];
    data.state = "";
    data.smallImageKey = await Resource(imgKeys[1]);
    if (_title && chapter && chapter.querySelector("span"))
      data.smallImageText = settings.ph.r_title(str[4]);
    if (_chapter)
      if (chapter && chapter.textContent.trim())
        data.state += settings.ph.r_cap(str[2]);
    if (_page)
      if (pageType)
        data.state +=
          str[1] + settings.ph.r_pag(str[3], [str[0], str[1], str[6]]);
      else data.state += str[0] + str[1];
    else
      data.state = data.state.replace(str[3].split("%l.pag%").join(""), str[8]);
    if (!_chapter && _page) {
      data.state = data.state
        .replace(new RegExp(`^${str[1]}`), "")
        .replace(str[3].split("%l.pag%").join(""), str[9]);
      if ((pageType as HTMLSelectElement).value == "true")
        data.state = data.state.replace(str[9], str[5]);
    }
    if (!_name && !_chapter && !_page) {
      data.details = data.details.replace(/:$/, "");
      delete data.state;
    } else if (!_chapter && !_page) {
      data.state = data.details;
      data.details = str[7];
    }
    /*
    {
      "if": { "reader": true },
      "id": "r_comment",
      "title": "├─ Comentário",
      "value": true
    },
    {
      "if": { "reader": true },
      "id": "r_reply",
      "title": "├─ Resposta",
      "value": true
    },
    {
      "if": { "reader": true },
      "id": "r_reply_user",
      "title": "└─ Respondendo User",
      "value": true
    },
    if (
      _report &&
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
      _comment &&
      document.activeElement.nodeName == "TEXTAREA" &&
      document.activeElement.parentElement.parentElement.className == "comentll"
    ) {
      data.smallImageKey = await Resource(imgKeys[3]);
      data.smallImageText = "Comentando...";
    } else if (
      _reply &&
      document.activeElement.nodeName == "INPUT" &&
      document.activeElement.parentElement.parentElement.className == "kkl"
    ) {
      data.smallImageKey = await Resource(imgKeys[7]);
      data.smallImageText = `Respondendo ${
        _replyU
          ? document.activeElement.parentElement.parentElement.querySelector(
              ".comentrig>a>a"
            ).textContent
          : "comentário..."
      }`;
    }*/
  } else if (
    pathname.startsWith("/obra/") &&
    !notfound &&
    (await presence.getSetting(settings.id.manga.this))
  ) {
    const m_name = document.querySelector(".tity>h2>b"),
      gendersQuery = document.querySelectorAll(".gencl"),
      tab = document.querySelector(".ativoman"),
      genders: string[] = [],
      _name = await presence.getSetting(settings.id.manga.name),
      _genders = await presence.getSetting(settings.id.manga.gender),
      _tab = await presence.getSetting(settings.id.manga.tab),
      _pagi = await presence.getSetting(settings.id.manga.pagination);
    data.details = _name
      ? m_name && m_name.textContent.trim()
        ? m_name.textContent.trim()
        : "..."
      : "Visualizando Mangá:";
    data.smallImageText = "...";
    if (_genders && gendersQuery.length != 0) {
      gendersQuery.forEach((item) => {
        genders.push(item.textContent.trim());
      });
      data.smallImageText += genders.join(", ");
    }
    data.smallImageKey = await Resource(imgKeys[2]);
    data.state = "";
    if (_tab)
      data.state =
        tab && tab.textContent.trim() ? tab.textContent.trim() : "...";
    if (_pagi) data.state += ` - ${getPagination(0)[0]}/${getPagination(0)[1]}`;
    if (_pagi && !_tab) data.state = data.state.replace(/^ - /, "");
    if (_name && !_genders) {
      data.state = data.details;
      data.details = "Visualizando Mangá:";
    }
    if (!_name && !_genders) {
      data.details = "Visualizando Mangá";
      delete data.state;
    }
  } else if (
    pathname.startsWith("/perfil/") &&
    !notfound &&
    (await presence.getSetting(settings.id.profile.this))
  ) {
    const username = getUser("..."),
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
        data.state = getUser("...");
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
      _name = await presence.getSetting(settings.id.group_scan.name),
      _members = await presence.getSetting(settings.id.group_scan.members),
      _pagi = await presence.getSetting(settings.id.group_scan.pagination);
    data.details = "Grupo:";
    data.state = "";
    if (_name)
      data.state =
        scanName && scanName.textContent.trim() ? scanName.textContent : "...";
    if (_members && scanMembers > 0) data.state += ` - ${scanMembers} Membros`;
    if (_pagi)
      data.state += ` - Pág. ${getPagination(0)[0]}/${getPagination(0)[1]}`;
    data.state = data.state.replace(/^ - /, "");
    if (_pagi && !_name && !_members)
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
            .length > 0
            ? (document.querySelector(searchElement) as HTMLInputElement).value
            : "...";
      } else {
        data.details = "Pesquisando...";
        delete data.state;
      }
      data.smallImageKey = await Resource(imgKeys[2]);
      delete data.smallImageText;
    }
  }
  if (
    (await presence.getSetting(settings.id.history.this)) &&
    parseInt(
      document
        .querySelector("[class$=historicob]")
        ?.parentElement.style.width.match(/\d+/)[0]
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
      document
        .querySelector(`[class$="historicob 22"]`)
        ?.parentElement.style.width.match(/\d+/)[0]
    ) > 0
  ) {
    data.details = "Notificações";
    data.smallImageKey = await Resource(imgKeys[6]);
    delete data.state;
    delete data.smallImageText;
  }
  if (await presence.getSetting(settings.id.custom_))
    if (isValidJSON(`{${await presence.getSetting(settings.id.custom)}}`)) {
      const jsonObj = await JSON.parse(
        `{${await presence.getSetting(settings.id.custom)}}`
      );
      for (const obj in jsonObj) 
        if (
          Array.isArray(jsonObj[obj]) &&
          pathname.match(new RegExp(obj, "g"))
        ) 
          for (let item in jsonObj[obj]) {
            item = jsonObj[obj][item];
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
  const _ = data as Record<string, string | undefined>,
    ZERO_WIDTH_NON_JOINER = "\u200C";
  for (const i in data)
    if (i == "largeImageKey" && (!_[i] || !_[i].toString().trim()))
      data.largeImageKey = (await Resource(imgKeys[0])) || imgKeys[0];
    else if (!_[i] || !_[i].toString().trim()) delete _[i];
    else if (
      isNaN(parseInt(_[i].toString())) &&
      _[i].toString().trim().length == 1
    )
      _[i] += ZERO_WIDTH_NON_JOINER;
  if (!data.details || !data.details.trim() || data.details.trim().length < 2)
    switch (parseInt(await presence.getSetting(settings.id.nodetails))) {
      case 0:
        presence.setActivity(data);
        break;
      case 1:
        presence.setActivity({ startTimestamp: browsingStamp });
        break;
      case 2:
        presence.setActivity();
    }
  else presence.setActivity(data);
  presence.info(
    `details: "${data.details}"\nstate: "${data.state}"\ntimestamp: ${
      data.startTimestamp
    }\nsmallKey: "${data.smallImageKey}"\nsmallText: "${
      data.smallImageText
    }"\nlargeKey: "${data.largeImageKey}"\nbuttons: \n${JSON.stringify(
      data.buttons[0],
      null,
      2
    )}`
  );
});
