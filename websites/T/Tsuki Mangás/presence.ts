const presence = new Presence({
    clientId: "714001239351885904"
  }),
  browsingStamp = Math.floor(Date.now() / 1000),
  SettingsId = {
    reader: {
      this: "reader",
      manga: "r_manga",
      title: "r_title",
      chapter: "r_chapter",
      page: "r_page",
      comment: "r_comment",
      report: "r_report"
    },
    manga: {
      this: "manga",
      name: "m_name",
      tab: "m_tab"
    },
    profile: {
      this: "profile",
      username: "p_username",
      tab: "p_aba",
      editing: "p_editing"
    },
    history: "history",
    search: "search",
    dark: "darkimg",
    logo: "logo"
  };
enum ResourceNames {
  logo = "logo",
  reading = "reading",
  search = "search",
  writing = "writing",
  history = "history",
  info = "info"
}
async function Resource(ResourceSelected: ResourceNames): Promise<string> {
  let value = ResourceSelected.toString();
  const logo: number = await presence.getSetting(SettingsId.logo),
    darkmode: boolean = await presence.getSetting(SettingsId.dark);
  if (ResourceSelected == ResourceNames.logo)
    logo != 0 ? (value += "_cloud") : (value += "_book");
  if (darkmode) value += "_dark";
  return value;
}
function getPagination(pagN: number): number[] {
  const pagination = document.getElementsByClassName("pagination")[pagN];
  let current = 1,
    max = 1;
  if (pagination) {
    current = parseInt(
      pagination.getElementsByClassName("active")[0].textContent
    );
    pagination.childNodes.forEach((item) => {
      if (
        item.nodeName == "LI" &&
        !isNaN(parseInt(item.textContent)) &&
        parseInt(item.textContent) > max
      )
        max = parseInt(item.textContent);
    });
  }
  return [current, max];
}
let menuSearchFocused = false;
const searchElement = document.querySelector("#menu>li>input");
if (searchElement) {
  searchElement.addEventListener("focus", function () {
    menuSearchFocused = true;
  });
  searchElement.addEventListener("blur", function () {
    menuSearchFocused = false;
  });
}
presence.on("UpdateData", async () => {
  const pathName = window.location.pathname,
    notfound =
      pathName == "/404" ||
      document.getElementsByClassName("notfound").length != 0,
    data: PresenceData = {
      largeImageKey: await Resource(ResourceNames.logo),
      startTimestamp: browsingStamp
    };
  if (pathName == "/") {
    let lancamentos = "...";
    const qlancamentos = document.querySelectorAll("div.leflist > div");
    if (qlancamentos.length > 0) {
      qlancamentos.forEach((item) => {
        if (item.className.includes("activedlanca"))
          lancamentos = item.textContent;
      });
    }
    data.details =
      "Início - " +
      `${menuSearchFocused}|${
        document.querySelector("ul.dp.dactive") ? true : false
      }`;
    data.state = "Lançamentos: " + lancamentos;
  } else if (pathName.startsWith("/login") && !notfound)
    data.details = "Logando...";
  else if (pathName.startsWith("/registrar") && !notfound)
    data.details = "Registrando...";
  else if (pathName.startsWith("/lista-mangas") && !notfound) {
    data.details = `Lista de Mangás - Página ${getPagination(0)[0]}/${
      getPagination(0)[1]
    }`;
    let Generos = "";
    const GenerosN = document.querySelectorAll(
      "div.multiselect>div>div>span>span"
    );
    if (GenerosN.length > 0)
      GenerosN.forEach((item) => {
        if (Generos.length == 0) Generos += item.textContent;
        else Generos += `, ${item.textContent}`;
      });
    data.state = `Gêneros: ${!Generos ? "Todos" : Generos}`;
  } else if (pathName.startsWith("/perfil/") && !notfound) {
    const username = document.querySelector("#capapl > b"),
      sessionUsername = (document.querySelector(
        "#menu>li>ul>a"
      ) as HTMLLinkElement).href
        .split("/")
        .slice(-1)[0],
      usernameValue = [0, "...", true];
    if (!(await presence.getSetting(SettingsId.profile.username))) {
      usernameValue[1] = "👁‍🗨👁‍🗨";
      usernameValue[3] = false;
    } else usernameValue[3] = true;
    if (
      username &&
      username.textContent &&
      pathName.split("/").slice(-1)[0] != "editar"
    ) {
      usernameValue[0] = 0;
      if (usernameValue[3]) usernameValue[1] = username.textContent;
    } else if (
      pathName.split("/").length == 4 &&
      sessionUsername &&
      sessionUsername == pathName.split("/").slice(-2)[0]
    ) {
      usernameValue[0] = 1;
      if (usernameValue[3]) usernameValue[1] = sessionUsername;
    } else if (
      pathName.split("/").length == 4 &&
      sessionUsername &&
      pathName.split("/").slice(-1)[0] == "editar" &&
      sessionUsername != pathName.split("/").slice(-2)[0]
    ) {
      usernameValue[0] = 0;
      if (usernameValue[3]) usernameValue[1] = pathName.split("/").slice(-2)[0];
    }
    data.details =
      usernameValue[0] == 0 ? "Visualizando Perfil:" : "Editando Perfil:";
    data.state = usernameValue[1].toString();
  } else if (pathName.startsWith("/manga/") && !notfound) {
    const MangaDefaultName = document.querySelector(
        "#app > div.manga.mtopmanga > div.all > div.rigt > div.tity > h2 > b"
      ),
      MangaAltNames = document.querySelector(
        "#app > div.manga.mtopmanga > div.all > div.lef > div.altt"
      );
    data.details = "Visualizando Mangá:";
    data.state =
      MangaDefaultName && MangaDefaultName.textContent.trim()
        ? MangaDefaultName.textContent
        : "...";
    if (MangaAltNames && MangaAltNames.textContent.trim())
      data.state += ` (${MangaAltNames.textContent})`;
    const qgenders = document.querySelector("div.mtop>span");
    let genders = "";
    if (qgenders)
      qgenders.childNodes.forEach((item) => {
        if (item.textContent == "Gêneros:") return;
        if (genders) genders += ", ";
        genders += item.textContent.replace(/^\s+|\s+$/g, "");
      });
    if (genders) {
      data.smallImageKey = await Resource(ResourceNames.search);
      data.smallImageText = genders;
    }
  } else if (pathName.startsWith("/leitor/") && !notfound) {
    const overlay = document.querySelector(
        "#app > div.manga > div.v--modal-overlay"
      ),
      qmanga = document.querySelector("b.f20"),
      qchapter = document.querySelector("b.f14c"),
      qpage = document.querySelector("select.backgsla.frightrr"),
      manga = qmanga ? qmanga.textContent : "...";
    let page = "...";
    if (qpage) {
      page = (qpage as HTMLInputElement).value;
      if (page)
        isNaN(parseInt(page))
          ? (page = " - Páginas abertas")
          : (page = " - Página " + page);
    }
    data.smallImageKey = await Resource(ResourceNames.reading);
    data.smallImageText = "Lendo...";
    data.details = manga ? manga : "...";
    if (qchapter) {
      data.state = qchapter.childNodes[0].textContent.trim();
      if (qchapter.textContent.includes("-"))
        data.state += ` - "${qchapter.childNodes[1].textContent.replace(
          " - ",
          ""
        )}"`;
    }
    data.state += page;
    if (
      (await presence.getSetting(SettingsId.reader.comment)) &&
      overlay &&
      overlay.getAttribute("data-modal").includes("comentarios")
    ) {
      data.smallImageKey = await Resource(ResourceNames.writing);
      data.smallImageText = "Comentando...";
    } else if (
      (await presence.getSetting(SettingsId.reader.report)) &&
      overlay &&
      overlay.getAttribute("data-modal").includes("report")
    ) {
      data.smallImageKey = await Resource(ResourceNames.info);
      data.smallImageText = "Reportando...";
    }
  } else if (
    pathName.startsWith("/scan/") &&
    pathName != "/scan/" &&
    !notfound
  ) {
    const scanName = document.querySelector(
        "#app > div.scan > div.contentscan > div > h2"
      ),
      qscanMembers = document.querySelectorAll(
        "#app > div.scan > div.contentscan > div > div.membrosscan > b"
      ).length;
    let scanMembers = "";
    if (qscanMembers > 0) scanMembers = ` - ${qscanMembers.toString()} Membros`;
    data.details = "Visualizando Grupo:";
    data.state =
      (scanName != null && scanName.textContent.trim()
        ? scanName.textContent
        : "...") +
      scanMembers +
      ` - Página ${getPagination(0)[0]}/${getPagination(0)[1]}`;
  }
  if (
    (await presence.getSetting(SettingsId.history)) &&
    (document.getElementsByClassName("bm-menu")[0] as HTMLElement).style
      .width !== "0px"
  ) {
    const hCategory = document
      .getElementsByClassName("activmancap")[0]
      .textContent.replace(/^\s+|\s+$/g, "");
    let hSession;
    document.querySelectorAll("div.selecths").forEach((item) => {
      if (item.classList[item.classList.length - 1].includes("selecths"))
        hSession = `${item.childNodes[0].textContent} ${item.childNodes[1].textContent}`;
    });
    const qUser = document.querySelector("#menu>li>ul>a");
    let user = qUser
      ? (qUser as HTMLLinkElement).href.split("/").slice(-1)[0]
      : "...";
    data.details = "Visualizando Histórico:";
    data.state = `${hCategory} - ${hSession} - Página ${getPagination(0)[0]}/${
      getPagination(0)[1]
    }`;
    if (!(await presence.getSetting(SettingsId.profile.username)))
      user = "👁‍🗨👁‍🗨";
    data.smallImageKey = await Resource(ResourceNames.history);
    data.smallImageText = "Username: " + user;
  }
  presence.setActivity(data);
});
