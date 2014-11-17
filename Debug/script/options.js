//Tablacus Explorer

var nTabMax = 0;
var TabIndex = -1;
var g_x = {Menu: null, Addons: null};
var g_Chg = {Menus: false, Addons: false, Tab: false, Tree: false, View: false, Data: null};
var g_arMenuTypes = ["Default", "Context", "Background", "Tabs", "Tree", "File", "Edit", "View", "Favorites", "Tools", "Help", "TaskTray", "System", "Alias"];
var g_MenuType = null;
var g_dlgAddons;
var g_tdDown;
var g_bDrag;
var g_pt = {x: 0, y: 0};
var g_Gesture;
var g_tid = null;

function SetDefaultLangID()
{
	document.F.Conf_Lang.value = navigator.userLanguage.replace(/\-.*/,"");
}

function OpenGroup(id)
{
	var o = document.getElementById(id);
	o.style.display = api.strcmpi(o.style.display, "block") ? "block" : "none";
}

SetOptions = function ()
{
	if (!ConfirmX(false, ReplaceMenus)) {
		return;
	}
	for (var i in document.F.elements) {
		if (!/=|:/.test(i)) {
			if (/^Tab_|^Tree_|^View_|^Conf_/.test(i)) {
				te.Data[i] = GetElementValue(document.F.elements[i]);
			}
		}
	}
	SaveMenus();
	SaveAddons();

	SetTabControls();
	SetTreeControls();
	SetFolderViews();

	te.Data.bReload = true;
	window.close();
}

AddEventEx(window, "beforeunload", function ()
{
	SaveAddons();
});

function ResetForm()
{
	var TV = te.Ctrl(CTRL_TV);
	if (TV) {
		document.F.Tree_Align.value = TV.Align;
		document.F.Tree_Style.value = TV.Style;
		document.F.Tree_EnumFlags.value = TV.EnumFlags;
		document.F.Tree_RootStyle.value = TV.RootStyle;
		if (TV.Align & 2) {
			document.F.Tree_Root.value = TV.Root;
		}
		document.F.Tree_Width.value = TV.Width;
	}
	var TC = te.Ctrl(CTRL_TC);
	if (TC) {
		document.F.Tab_Style.value = TC.Style;
		document.F.Tab_Align.value = TC.Align;
		document.F.Tab_TabWidth.value = TC.TabWidth;
		document.F.Tab_TabHeight.value = TC.TabHeight;

		document.F.Tab_Left.value = TC.Left;
		document.F.Tab_Top.value = TC.Top;
		document.F.Tab_Width.value = TC.Width;
		document.F.Tab_Height.value = TC.Height;
	}
	var FV = te.Ctrl(CTRL_FV);
	if (FV) {
		document.F.View_Type.value = FV.Type;
		document.F.View_ViewMode.value = FV.CurrentViewMode;
		document.F.View_fFlags.value = FV.FolderFlags;
		document.F.View_Options.value = FV.Options;
		document.F.View_ViewFlags.value = FV.ViewFlags;
	}

	for(i = 0; i < document.F.length; i++) {
		o = document.F.elements[i];
		if (api.strcmpi(o.type, 'checkbox') == 0) {
			if (!/^Conf_/.test(o.id)) {
				o.checked = false;
			}
		}
	}
	for(i = 0; i < document.F.length; i++) {
		o = document.F.elements[i];
		if (/=/.test(o.id)) {
			var ar = o.id.split("=");
			if (document.F.elements[ar[0]].value == eval(ar[1])) {
				document.F.elements[i].checked = true;
			}
		}
		if (/:/.test(o.id)) {
			var ar = o.id.split(":");
			if (document.F.elements[ar[0]].value & eval(ar[1])) {
				document.F.elements[i].checked = true;
			}
		}
	}
	document.F.Color_Conf_TrailColor.style.backgroundColor = GetWebColor(document.F.Conf_TrailColor.value);
}

function ClickTab(o, nMode)
{
	nMode = api.LowPart(nMode);
	if (o && o.id) {
		nTabIndex = o.id.replace(new RegExp('tab', 'g'), '') - 0;
	}
	var i = 0;
	var ovTab;
	while (ovTab = document.getElementById('tab' + i)) {
		ovPanel = document.getElementById('panel' + i);
		if (i == nTabIndex) {
			try {
				ovTab.focus();
			} catch (e) {}
			ovTab.className = 'activetab';
			ovPanel.style.display = 'block';
			var h = document.documentElement.clientHeight || document.body.clientHeight;
			h -= 60;
			if (h > 0) {
				ovPanel.style.height = h + 'px';
				ovPanel.style.height = 2 * h - ovPanel.offsetHeight + "px";
			}
		}
		else {
			ovTab.className = 'tab';
			ovPanel.style.display = 'none';
		}
		i++;
	}
	nTabMax = i;
}

function ClickTree(o, nMode, strChg)
{
	if (g_tid) {
		return;
	}
	if (strChg) {
		g_Chg[strChg] = true;
	}
	nMode = api.LowPart(nMode);
	var newTab = TabIndex != -1 ? TabIndex : 0;
	if (o && o.id && /tab([^_]+)(_?)(.*)/.test(o.id)) {
		newTab = RegExp.$1 + RegExp.$2 + RegExp.$3;
		document.getElementById("MoveButton").style.display = RegExp.$1 == 1 || RegExp.$1 == 2 ? "inline-block" : "none";
		if (nMode == 0) {
			switch (RegExp.$1 - 0) {
				case 1:
					document.body.style.cursor = "wait";
					setTimeout(function () {
						LoadAddons();
						document.body.style.cursor = "auto";
					}, 10);
					break;
				case 2:
					LoadMenus(RegExp.$3 - 0);
					break;
			}
		}
	}
	if (newTab != TabIndex) {
		if (newTab == "0") {
			var o = document.getElementById("DefaultLangID");
			if (o && o.innerHTML == "") {
				o.innerHTML = navigator.userLanguage.replace(/\-.*/,"");
			}
		}
		var ovTab = document.getElementById('tab' + TabIndex);
		if (ovTab) {
			var ovPanel = document.getElementById('panel' + TabIndex) || document.getElementById('panel' + TabIndex.replace(/_\d+/, ""));
			ovTab.className = 'button';
			ovPanel.style.display = 'none';
		}
		TabIndex = newTab;
		ovTab = document.getElementById('tab' + TabIndex);
		if (ovTab) {
			ovPanel = document.getElementById('panel' + TabIndex) || document.getElementById('panel' + TabIndex.replace(/_\d+/, ""));
			if (/2_(.+)/.test(TabIndex)) {
				document.F.Menus.selectedIndex = RegExp.$1;
				setTimeout("SwitchMenus(document.F.Menus);", 100);
			}
			ovTab.className = 'hoverbutton';
			ovPanel.style.display = 'block';
			var h = document.documentElement.clientHeight || document.body.clientHeight;
			h -= 40;
			if (h > 0) {
				ovPanel.style.height = h + 'px';
				ovPanel.style.height = 2 * h - ovPanel.offsetHeight + "px";
			}
			var o = document.getElementById("tab_");
			o.style.height = h + 'px';
			o.style.height = 2 * h - o.offsetHeight + "px";
		}
	}
}

function ClickButton(o, n, f)
{
	var op = document.getElementById("tab" + n + "_");
	if (f || o.innerText != '-') {
		o.innerText = '-';
		op.style.display = "block";
	}
	else {
		o.innerText = '+';
		op.style.display = "none";
	}
}

function SetRadio(o)
{
	var ar = o.id.split("=");
	document.F.elements[ar[0]].value = ar[1];
}

function SetCheckbox(o)
{
	var ar = o.id.split(":");
	if (o.checked) {
		document.F.elements[ar[0]].value |= eval(ar[1]);
	}
	else {
		document.F.elements[ar[0]].value &= ~eval(ar[1]);
	}
}

function SetValue(n, v)
{
	if (v.value != '!') {
		n.value = v.value.replace(/\\n/, "\n");
	}
}

function AddValue(name, i, min, max)
{
	var o = document.F.elements[name];
	i += api.LowPart(o.value);
	i = (i < min) ? min : i;
	o.value = (i < max) ? i : max;
}

function ChooseColor1(o)
{
	setTimeout(function ()
	{
		var o2 = document.F.elements[o.id.replace("Color_", "")];
		var c = ChooseColor(o2.value);
		if (c) {
			o2.value = c;
			o.style.backgroundColor = GetWebColor(c);
		}
	}, 100);
}

function SetTreeControls()
{
	if (g_Chg.Tree) {
		if (document.getElementById("Default_Tree").checked) {
			var cTV = te.Ctrls(CTRL_TV);
			for (i = 0; i < cTV.Count; i++) {
				SetTreeControl(cTV.Item(i));
			}
		}
		else {
			var TV = te.Ctrl(CTRL_TV);
			if (TV) {
				SetTreeControl(TV);
			}
		}
	}
}

function SetTreeControl(TV)
{
	if (TV) {
		var Selected = TV.SelectedItem;
		TV.Align = document.F.Tree_Align.value;
		TV.Style = document.F.Tree_Style.value;
		TV.Width = document.F.Tree_Width.value;
		TV.SetRoot(document.F.Tree_Root.value, document.F.Tree_EnumFlags.value, document.F.Tree_RootStyle.value);
		TV.Expand(Selected, 1);
	}
}

function AddTabControl()
{
	if (document.F.Tab_Width.value == 0) {
		wsh.Popup(GetText("Please enter the width."), 0, "Tablacus Explorer", MB_ICONEXCLAMATION);
		return;
	}
	if (document.F.Tab_Height.value == 0) {
		wsh.Popup(GetText("Please enter the height."), 0, "Tablacus Explorer", MB_ICONEXCLAMATION);
		return;
	}
	var TC = te.CreateCtrl(CTRL_TC, document.F.Tab_Left.value, document.F.Tab_Top.value, document.F.Tab_Width.value, document.F.Tab_Height.value, document.F.Tab_Style.value, document.F.Tab_Align.value, document.F.Tab_TabWidth.value, document.F.Tab_TabHeight.value);
	TC.Selected.Navigate2("c:\\", SBSP_NEWBROWSER, document.F.View_Type.value, document.F.View_ViewMode.value, document.F.View_fFlags.value, 0, document.F.View_Options.value, document.F.View_ViewFlags.value);
}

function DelTabControl()
{
	var TC = te.Ctrl(CTRL_TC);
	if (TC) {
		TC.Close();
	}
}

function SetTabControls()
{
	if (g_Chg.Tab) {
		if (document.getElementById("Default_Tab").checked) {
			var cTC = te.Ctrls(CTRL_TC);
			for (i = 0; i < cTC.Count; i++) {
				SetTabControl(cTC.Item(i));
			}
		}
		else {
			var TC = te.Ctrl(CTRL_TC);
			if (TC) {
				SetTabControl(TC);
			}
		}
	}
}

function SetTabControl(TC)
{
	if (TC) {
		TC.Style = document.F.Tab_Style.value;
		TC.Align = document.F.Tab_Align.value;
		TC.TabWidth = document.F.Tab_TabWidth.value;
		TC.TabHeight = document.F.Tab_TabHeight.value;
	}
}

function GetTabControl()
{
	var TC = te.Ctrl(CTRL_TC);
	if (TC) {
		document.F.Tab_Left.value = TC.Left;
		document.F.Tab_Top.value = TC.Top;
		document.F.Tab_Width.value = TC.Width;
		document.F.Tab_Height.value = TC.Height;
	}
}

function MoveTabControl()
{
	var TC = te.Ctrl(CTRL_TC);
	if (TC) {
		if (document.F.Tab_Width.value != "" && document.F.Tab_Height.value != "") {
			TC.Left = document.F.Tab_Left.value;
			TC.Top = document.F.Tab_Top.value;
			TC.Width = document.F.Tab_Width.value;
			TC.Height = document.F.Tab_Height.value;
		}
	}
}

function SetFolderViews()
{
	FV = te.Ctrl(CTRL_FV);
	if (g_Chg.View) {
		if (document.getElementById("Default_List").checked) {
			var cFV = te.Ctrls(CTRL_FV);
			for (i = 0; i< cFV.Count; i++) {
				SetFolderView(cFV.Item(i));
			}
		}
		else if (FV) {
			SetFolderView(FV);
		}
	}
	if (FV) {
		FV.CurrentViewMode = document.F.View_ViewMode.value;
	}
}

function SetFolderView(FV)
{
	if (FV) {
		FV.FolderFlags = document.F.View_fFlags.value;
		FV.Options = document.F.View_Options.value;
		FV.ViewFlags = document.F.View_ViewFlags.value;
		if (FV.Type != document.F.View_Type.value) {
			FV.Type = document.F.View_Type.value;
		}
		else {
			FV.Refresh();
		}
	}
}

function InitConfig(o)
{
	var InstallPath = fso.GetParentFolderName(api.GetModuleFileName(null));
	if (InstallPath == te.Data.DataFolder) {
		return;
	}
	if (!confirmYN(GetText("Are you sure?"))) {
		return;
	}
	var Dist = sha.NameSpace(te.Data.DataFolder);
	Dist.MoveHere(fso.BuildPath(InstallPath, "layout"), 0);
	wsh.Popup(GetText("Completed."), 0, "Tablacus Explorer", MB_ICONINFORMATION);
	o.disabled = true;
}

function SelectPos(o, s)
{
	var v = o[o.selectedIndex].value;
	if (v != "") {
		document.F.elements[s].value = v;
	}
}

function SwitchMenus(o)
{
	if (g_x.Menus) {
		g_x.Menus.style.display = "none";

		var o = document.F.elements.Menus;
		var i = o.length;
		while (--i >= 0) {
			var a = o[i].value.split(",");
			if ("Menus_" + a[0] == g_x.Menus.name) {
				s = a[0] + "," + document.F.elements["Menus_Base"].selectedIndex + "," + document.F.elements["Menus_Pos"].value;
				if (s != o[i].value) {
					g_Chg.Menus = true;
					o[i].value = s;
				}
				break;
			}
		}
	}
	if (o) {
		(function (a) { g_tid = setTimeout(function ()
		{
			g_x.Menus = document.F.elements["Menus_" + a[0]];
			g_x.Menus.style.display = "inline";
			document.F.elements["Menus_Base"].selectedIndex = a[1];
			document.F.elements["Menus_Pos"].value = api.LowPart(a[2]);
			g_tid = null;
		}, 100);}) (o.value.split(","));
	}
}

function SwitchX(mode, o)
{
	g_x[mode].style.display = "none";
	g_x[mode] = document.F.elements[mode + o.value];
	g_x[mode].style.display = "inline";
}

function ClearX(mode)
{
	g_Chg.Data = null;
}

function CancelX(mode)
{
	g_x[mode].selectedIndex = -1;
}

ChangeX = function (mode)
{
	g_Chg.Data = mode;
}

function ConfirmX(bCancel, fn)
{
	try {
		if (g_Chg.Data) {
			switch (wsh.Popup(GetText("Do you want to replace?"), 0, TITLE, bCancel ? MB_ICONQUESTION | MB_YESNOCANCEL : MB_ICONQUESTION | MB_YESNO)) {
				case IDYES:
					if (g_x[g_Chg.Data].selectedIndex >= 0) {
						(fn || ReplaceX)(g_Chg.Data);
					}
					else {
						AddX(g_Chg.Data, fn);
					}
				case IDNO:
					ClearX(g_Chg.Data);
					return true;
			}
			return false;
		}
	} catch (e) {}
	return true;
}

function EditMenus()
{
	if (g_x.Menus.selectedIndex < 0) {
		return;
	}
	ClearX("Menus");
	var a = g_x.Menus[g_x.Menus.selectedIndex].value.split(g_sep);
	var a2 = a[0].split(/\\t/);
	a2.unshift(GetText(a2.shift()));
	document.F.Menus_Key.value = a2.length > 1 ? GetKeyName(a2.pop()) : "";
	document.F.Menus_Name.value = a2.join("\\t");
	document.F.Menus_Filter.value = a[1];
	var p = { s: a[2] };
	MainWindow.OptionDecode(a[3], p);
	document.F.Menus_Path.value = p.s;
	SetType(document.F.Menus_Type, a[3]);
	document.F.Icon.value = a[4] || "";
	SetImage();
}

EditX = function (mode)
{
	if (g_x[mode].selectedIndex < 0) {
		return;
	}
	ClearX(mode);
	var a = g_x[mode][g_x[mode].selectedIndex].value.split(g_sep);
	document.F.elements[mode + mode].value = a[0];
	var p = { s: a[1] };
	MainWindow.OptionDecode(a[2], p);
	document.F.elements[mode + "Path"].value = p.s;
	SetType(document.F.elements[mode + "Type"], a[2]);
	if (api.strcmpi(mode, "Key") == 0) {
	 	SetKeyShift();
	}
}

function SetType(o, value)
{
	var i = o.length;
	while (--i >= 0) {
		if (o[i].value == value) {
			o.selectedIndex = i;
			break;
		}
	}
	if (i < 0) {
		i = o.length++;
		o[i].value = value;
		o[i].innerText = value;
		o.selectedIndex = i;
	}
}

function AddX(mode, fn)
{
	g_x[mode].selectedIndex = ++g_x[mode].length - 1;
	(fn || ReplaceX)(mode);
}

function ReplaceMenus()
{
	ClearX("Menus");
	if (g_x.Menus.selectedIndex < 0) {
		g_x.Menus.selectedIndex = ++g_x.Menus.length - 1;
	}
	var sel = g_x.Menus[g_x.Menus.selectedIndex];
	var o = document.F.Menus_Type;
	var s = GetSourceText(document.F.Menus_Name.value);
	if (document.F.Menus_Key.value.length) {
		var n = GetKeyKey(document.F.Menus_Key.value);
		s += "\\t" + (n ? api.sprintf(8, "$%x", n) : document.F.Menus_Key.value);
	}
	var p = { s: document.F.Menus_Path.value };
	MainWindow.OptionEncode(o[o.selectedIndex].value, p);
	SetMenus(sel, [s, document.F.Menus_Filter.value, p.s, o[o.selectedIndex].value, document.F.Icon.value]);
	g_Chg.Menus = true;
}

function ReplaceX(mode)
{
	ClearX(mode);
	if (g_x[mode].selectedIndex < 0) {
		g_x[mode].selectedIndex = ++g_x[mode].length - 1;
	}
	var sel = g_x[mode][g_x[mode].selectedIndex];
	var o = document.F.elements[mode + "Type"];
	var p = { s: document.F.elements[mode + "Path"].value };
	MainWindow.OptionEncode(o[o.selectedIndex].value, p);
	SetData(sel, [document.F.elements[mode + mode].value, p.s, o[o.selectedIndex].value]);
	g_Chg[mode] = true;
}

function RemoveMenus()
{
	ClearX("Menus");
	if (g_x.Menus.selectedIndex < 0 || !confirmYN(GetText("Are you sure?"))) {
		return;
	}
	g_x.Menus[g_x.Menus.selectedIndex] = null;
	g_Chg.Menus = true;
}

function RemoveX(mode)
{
	ClearX(mode);
	if (g_x[mode].selectedIndex < 0 || !confirm(GetText("Are you sure?"))) {
		return;
	}
	g_x[mode][g_x[mode].selectedIndex] = null;
	g_Chg[mode] = true;
}

function MoveX(mode, n)
{
	if (g_x[mode].selectedIndex < 0 || g_x[mode].selectedIndex + n < 0 || g_x[mode].selectedIndex + n >= g_x[mode].length) {
		return;
	}
	var src = g_x[mode][g_x[mode].selectedIndex];
	var dist = g_x[mode][g_x[mode].selectedIndex + n];
	var text = dist.text;
	var value = dist.value;
	dist.text = src.text;
	dist.value = src.value;
	src.text = text;
	src.value = value;
	g_x[mode].selectedIndex += n;
	g_Chg[mode] = true;
}

function SetMenus(sel, a)
{
	sel.value = PackData(a);
	var a2 = a[0].split(/\\t/);
	sel.text = [GetText(a2[0]), a[1]].join(" ").replace(/[\r\n].*/, "");
}

function LoadMenus(nSelected)
{
	if (!g_x.Menus) {
		var arFunc = [];
		for (var i in MainWindow.eventTE.AddType) {
			MainWindow.eventTE.AddType[i](arFunc);
		}
		var oa = document.F.Menus_Type;
		for (var i = 0; i < arFunc.length; i++) {
			var o = oa[++oa.length - 1];
			o.value = arFunc[i];
			o.innerText = GetText(arFunc[i]);
		}

		oa = document.F.Menus;
		oa.length = 0;

		for (j in g_arMenuTypes) {
			document.getElementById("Menus_List").insertAdjacentHTML("BeforeEnd", '<select name="Menus_' + g_arMenuTypes[j] + '" size="17" style="width: 150px; height: 400px; display: none; font-family:' + document.F.elements["Menus_Pos"].style.fontFamily + '" ondblclick="EditMenus()" oncontextmenu="CancelX(\'Menus\')"></select>');
			var menus = teMenuGetElementsByTagName(g_arMenuTypes[j]);
			if (menus && menus.length) {
				oa[++oa.length - 1].value = g_arMenuTypes[j] + "," + menus[0].getAttribute("Base") + "," + menus[0].getAttribute("Pos");
				var o = document.F.elements["Menus_" + g_arMenuTypes[j]];
				var items = menus[0].getElementsByTagName("Item");
				if (items) {
					var i = items.length;
					o.length = i;
					while (--i >= 0) {
						var item = items[i];
						SetMenus(o[i], [item.getAttribute("Name"), item.getAttribute("Filter"), item.text, item.getAttribute("Type"), item.getAttribute("Icon")]);
					}
				}
			}
			else {
				oa[++oa.length - 1].value = g_arMenuTypes[j];
			}
			oa[oa.length - 1].text = GetText(g_arMenuTypes[j]);
			if (g_MenuType && api.strcmpi(g_MenuType, g_arMenuTypes[j]) == 0) {
				nSelected = oa.length - 1;
				oa[nSelected].selected = true;
				g_MenuType = undefined;
			}
		}
		SwitchMenus(oa[nSelected]);
	}
}

function LoadX(mode, fn)
{
	if (!g_x[mode]) {
		setTimeout(function ()
		{
			var arFunc = [];
			for (var i in MainWindow.eventTE.AddType) {
				MainWindow.eventTE.AddType[i](arFunc);
			}
			var oa = document.F.elements[mode + "Type"] || document.F.Type;
			while (oa.length) {
				oa.removeChild(oa[0]);
			}
			for (var i = 0; i < arFunc.length; i++) {
				var o = oa[++oa.length - 1];
				o.value = arFunc[i];
				o.innerText = GetText(arFunc[i]);
			}
			g_x[mode] = document.F.elements[mode + "All"];
			if (g_x[mode]) {
				oa = document.F.elements[mode];
				oa.length = 0;
				xml = OpenXml(mode + ".xml", false, true);
				for (var j in g_Types[mode]) {
					oa[++oa.length - 1].text = GetTextEx(g_Types[mode][j]);
					oa[oa.length - 1].value = g_Types[mode][j];
					var o = document.F.elements[mode + g_Types[mode][j]];
					var items = xml.getElementsByTagName(g_Types[mode][j]);
					var i = items.length;
					if (i == 0 && g_Types[mode][j] == "List") {
						items = xml.getElementsByTagName("Folder");
						i = items.length;
					}
					o.length = i;
					while (--i >= 0) {
						var item = items[i];
						var s = item.getAttribute(mode);
						if (api.strcmpi(mode, "Key") == 0) {
							var ar = /,$/.test(s) ? [s] : s.split(",");
							for (var k = ar.length; k--;) {
								ar[k] = GetKeyName(ar[k]);
							}
							s = ar.join(",");
						}
						SetData(o[i], [s, item.text, item.getAttribute("Type")]);
					}
				}
			}
			else {
				g_x[mode] = document.F.List;
				g_x[mode].length = 0;
				var path = fso.GetParentFolderName(api.GetModuleFileName(null));
				var xml = te.Data["xml" + AddonName];
				if (!xml) {
					xml = te.CreateObject("Msxml2.DOMDocument");
					xml.async = false;
					xml.load(fso.BuildPath(path, "config\\" + AddonName + ".xml"));
					te.Data["xml" + AddonName] = xml;
				}

				var items = xml.getElementsByTagName("Item");
				var i = items.length;
				g_x[mode].length = i;
				while (--i >= 0) {
					var item = items[i];
					SetData(g_x[mode][i], [item.getAttribute("Name"), item.text, item.getAttribute("Type"), item.getAttribute("Icon"), item.getAttribute("Height")]);
				}
				xml = null;
			}
			fn && fn();
		}, 500);
	}
}

function SaveMenus()
{
	if (g_Chg.Menus) {
		var xml = CreateXml();

		var root = xml.createElement("TablacusExplorer");
		for (var j in g_arMenuTypes) {
			var o = document.F.elements["Menus_" + g_arMenuTypes[j]];
			var items = xml.createElement(g_arMenuTypes[j]);
			var a = document.F.elements.Menus[j].value.split(",");
			items.setAttribute("Base", api.LowPart(a[1]));
			items.setAttribute("Pos", api.LowPart(a[2]));
			for (var i = 0; i < o.length; i++) {
				var item = xml.createElement("Item");
				var a = o[i].value.split(g_sep);
				item.setAttribute("Name", a[0]);
				item.setAttribute("Filter", a[1]);
				item.text = a[2];
				item.setAttribute("Type", a[3]);
				item.setAttribute("Icon", a[4]);
				items.appendChild(item);
			}
			root.appendChild(items);
		}
		xml.appendChild(root);
		te.Data.xmlMenus = xml;
		MainWindow.RunEvent1("ConfigChanged", "Menus");
	}
}

function SaveX(mode)
{
	if (g_Chg[mode]) {
		var xml = CreateXml();
		var root = xml.createElement("TablacusExplorer");
		for (var j in g_Types[mode]) {
			var o = document.F.elements[mode + g_Types[mode][j]];
			for (var i = 0; i < o.length; i++) {
				var item = xml.createElement(g_Types[mode][j]);
				var a = o[i].value.split(g_sep);
				var s = a[0];
				if (api.strcmpi(mode, "Key") == 0) {
					var ar = /,$/.test(s) ? [s] : s.split(",");
					for (var k = ar.length; k--;) {
						var n = GetKeyKey(ar[k]);
						if (n) {
							ar[k] = api.sprintf(8, "$%x", n);
						}
					}
					s = ar.join(",");
				}
				item.setAttribute(mode, s);
				item.text = a[1];
				item.setAttribute("Type", a[2]);
				root.appendChild(item);
			}
		}
		xml.appendChild(root);
		SaveXmlEx(mode.toLowerCase() + ".xml", xml);
	}
}

function SaveAddons()
{
	if (g_Chg.Addons || te.Data.bErrorAddons) {
		te.Data.bErrorAddons = false;
		var xml = CreateXml();
		var root = xml.createElement("TablacusExplorer");
		var table = document.getElementById("Addons");
		for (var j = 0; j < table.rows.length; j++) {
			var Id = table.rows(j).id.replace("Addon_", "").toLowerCase();
			var div = document.getElementById("Addon2_" + Id);
			var item = null;
			var items = te.Data.Addons.getElementsByTagName(Id);
			if (items.length) {
				item = items[0].cloneNode(true);
			}
			if (!item) {
				item = xml.createElement(Id);
			}
			var Enabled = api.StrCmpI(div.style.color, "gray") ? 1 : 0;
			if (Enabled) {
				var AddonFolder = fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), "addons\\" + Id);
				Enabled = 0;
				if (fso.FolderExists(AddonFolder + "\\lang")) {
					Enabled = 2;
				}
				if (fso.FileExists(AddonFolder + "\\script.vbs")) {
					Enabled |= 8;
				}
				if (fso.FileExists(AddonFolder + "\\script.js")) {
					Enabled |= 1;
				}
				Enabled = (Enabled & 9) ? Enabled : 4;
			}
			item.setAttribute("Enabled", Enabled);
			root.appendChild(item);
		}
		xml.appendChild(root);
		te.Data.Addons = xml;
		MainWindow.RunEvent1("ConfigChanged", "Addons");
	}
}

function SetData(sel, a)
{
	sel.value = PackData(a);
	sel.text = GetText(a[0]);
}

function PackData(a)
{
	var i = a.length;
	while (--i >= 0) {
		a[i] = (a[i] || "").replace(g_sep, "`  ~");
	}
	return a.join(g_sep);
}

function GetAddons()
{
	LoadAddons();
	try {
		if (g_dlgAddons && g_dlgAddons.window) {
			g_dlgAddons.focus();
			return;
		}
	}
	catch (e) {
		g_dlgAddons = null;
	}
	g_dlgAddons = showModelessDialog("addons.html", window, "dialogWidth: 640px; dialogHeight: 480px; resizable: yes; status=0");
	for (;;) {
		try {
			if (g_dlgAddons.window.document.body) {
				break;
			}
		} catch (e) {}
		api.Sleep(100);
	}
	g_dlgAddons.window.UpdateAddon = function (Id, o)
	{
		if (!o) {
			AddAddon(document.getElementById("Addons"), Id, "Disable");
			g_Chg.Addons = true;
		}
	}
}

function LoadAddons()
{
	if (g_x.Addons) {
		return;
	}
	g_x.Addons = true;

	var AddonId = [];
	var FindData = api.Memory("WIN32_FIND_DATA");
	var path = fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), "addons\\");
	var hFind = api.FindFirstFile(path + "*", FindData);
	var bFind = hFind != INVALID_HANDLE_VALUE;
	while (bFind) {
		var Id = FindData.cFileName;
		if (Id != "." && Id != ".." && !AddonId[Id]) {
			AddonId[Id] = 1;
		}
		bFind = api.FindNextFile(hFind, FindData);
	}
	api.FindClose(hFind);

	var table = document.getElementById("Addons");
	table.deleteRow(0);
	var root = te.Data.Addons.documentElement;
	if (root) {
		var items = root.childNodes;
		if (items) {
			for (var i = 0; i < items.length; i++) {
				var item = items[i];
				var Id = item.nodeName;
				if (AddonId[Id]) {
					AddAddon(table, Id, (api.LowPart(item.getAttribute("Enabled"))) ? "Disable" : "Enable");
					delete AddonId[Id];
				}
			}
		}
	}
	for (var Id in AddonId) {
		if (fso.FileExists(path + Id + "\\config.xml")) {
			AddAddon(table, Id, "Enable");
		}
	}
}

function AddAddon(table, Id, Enable)
{
	var tr = table.insertRow();
	tr.className = (tr.rowIndex & 1) ? "oddline" : "";
	tr.id = "Addon_" + Id;
	SetAddon(tr.insertCell(), Id, Enable);
}

function SetAddon(td, Id, Enable)
{
	var info = GetAddonInfo(Id);

	if (info.Description && info.Description.length > 80) {
		info.Description = info.Description.substr(0, 80) + "...";
	}
	var s = [];
	s.push('<div Id="Addon2_' + Id + '" style="color: ');
	s.push((Enable == "Enable") ? "gray" : "black");
	s.push('"><input type="radio" name="AddonId" id="_'+ Id + '"><label for="_'+ Id + '"><b>' + info.Name + "</b>&nbsp;" + info.Version + "&nbsp;" + info.Creator + "<br>" + info.Description + "</div>");
	s.push('<input type="button" value="' + GetText('Remove') + '" onclick="AddonRemove(\'' + Id + '\')">');
	s.push('<input type="button" value="' + GetText(Enable) + '" onclick="AddonEnable(\'' + Id + '\', this)"');
	if (info.MinVersion && te.Version < CalcVersion(info.MinVersion)) {
		s.push(" disabled");
	}
	s.push('>');
	s.push('<input type="button" value="' + GetText('Info...') + '" onclick="AddonInfo(\'' + Id + '\')">');
	s.push('<input type="button" value="' + GetText('Options...') + '" onclick="AddonOptions(\'' + Id + '\')"');
	if (!info.Options) {
		s.push(" disabled");
	}
	s.push('></label>');
	td.innerHTML = s.join("");

	td.onmousedown = function (e)
	{
		g_tdDown = e ? e.currentTarget : window.event.srcElement;
		api.GetCursorPos(g_ptDrag);
	}

	td.onmouseup = function (e)
	{
		if (g_bDrag) {
			g_bDrag = false;
			SetCursor(document.getElementById("Addons"), "auto");
			var tdUp = e ? e.currentTarget : window.event.srcElement;
			if (g_tdDown != tdUp) {
				(function (src, dist) { setTimeout(function () {
					AddonMoveEx(src, dist);
				}, 100);}) (AddonRowIndex(g_tdDown) , AddonRowIndex(tdUp));
			}
		}
		g_tdDown = undefined;
	}

	td.onmousemove = function (e)
	{
		if (g_tdDown) {
			if (api.GetKeyState(VK_LBUTTON) < 0) {
				(e ? e.currentTarget : window.event.srcElement).style.cursor = "move";
				g_bDrag = true;
			}
			else {
				td.onmouseup(e);
			}
		}
	}
	ApplyLang(td);
}

function AddonRowIndex (td)
{
	var table = document.getElementById("Addons");
	for (var i = table.rows.length; i--;) {
		if (api.strcmpi(table.rows(i).cells(0).innerText, td.innerText) == 0) {
			return i;
		}
	}
}

function AddonInfo(Id)
{
	var info = GetAddonInfo(Id);
	var pubDate = "";
	if (info.pubDate) {
		pubDate = new Date(info.pubDate).toLocaleString() + "\n";
	}
	wsh.Popup(info.Name + " " + info.Version + " " + info.Creator + "\n\n" + info.Description + "\n\n" + pubDate + info.URL, 0, Id, MB_ICONINFORMATION);
}

function AddonWebsite(Id)
{
	var info = GetAddonInfo(Id);
	wsh.run(info.URL);
}

function AddonEnable(Id, o)
{
	var div = document.getElementById("Addon2_" + Id);
	if (o.value != GetText('Enable')) {
		for (var i in MainWindow.eventTE.AddonDisabled) {
			MainWindow.eventTE.AddonDisabled[i](Id);
		}
		o.value = GetText('Enable');
		div.style.color = "gray";
	}
	else {
		var info = GetAddonInfo(Id);
		if (!info.MinVersion || te.Version >= api.LowPart(info.MinVersion.replace(/\D/g, ""))) {
			o.value = GetText('Disable');
			div.style.color = "black";
		}
	}
	g_Chg.Addons = true;
}

function OptionMove(dir)
{
	if (/^1/.test(TabIndex)) {
		var r = document.F.AddonId;
		for (i = 0; i < r.length; i++) {
			if (r[i].checked) {
				try {
					AddonMoveEx(i, i + dir);
					document.getElementById("panel1").scrollTop += document.getElementById("Addons").rows(i).offsetHeight * dir;
				} catch (e) {}
	 			break;
			}
		}
	}
	else if (/^2/.test(TabIndex)) {
		if (g_x.Menus.selectedIndex < 0 || g_x.Menus.selectedIndex + dir < 0 || g_x.Menus.selectedIndex + dir >= g_x.Menus.length) {
			return;
		}
		var src = g_x.Menus[g_x.Menus.selectedIndex];
		var dist = g_x.Menus[g_x.Menus.selectedIndex + dir];
		var text = dist.text;
		var value = dist.value;
		dist.text = src.text;
		dist.value = src.value;
		src.text = text;
		src.value = value;
		g_x.Menus.selectedIndex += dir;
		g_Chg.Menus = true;
	}
}

function AddonMoveEx(src, dist)
{
	var table = document.getElementById("Addons");
	if (dist < 0 || dist >= table.rows.length) {
		return false;
	}
	var tr = table.rows(src);
	var id2 = tr.id;
	var td = tr.cells(0);

	var s = td.innerHTML
	var md = td.onmousedown;
	var mu = td.onmouseup;
	var mm = td.onmousemove;

	table.deleteRow(src);

	tr = table.insertRow(dist);
	td = tr.insertCell();
	tr.id = id2;
	td.innerHTML = s;
	td.onmousedown = md;
	td.onmouseup = mu;
	td.onmousemove = mm;

	var i = src > dist ? src : dist;
	var j = src > dist ? dist : src;
	while (i >= j) {
		table.rows(i).className = (i & 1) ? "oddline" : "";
		i--;
	}
	document.F.AddonId[dist].checked = true;
	g_Chg.Addons = true;
	return false;
}

function AddonRemove(Id)
{
	if (!confirmYN(GetText("Are you sure?"))) {
		return;
	}

	for (var i in MainWindow.eventTE.AddonDisabled) {
		MainWindow.eventTE.AddonDisabled[i](Id);
	}
	sf = api.Memory("SHFILEOPSTRUCT");
	sf.hwnd = te.hwnd;
	sf.wFunc = FO_DELETE;
	sf.fFlags = FOF_ALLOWUNDO;
	sf.pFrom = fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), "addons\\"+ Id) + "\0";
	if (api.SHFileOperation(sf) == 0) {
		if (!sf.fAnyOperationsAborted) {
			var table = document.getElementById("Addons");
			var tr = document.getElementById("Addon_" + Id);
			var i = tr.rowIndex;
			table.deleteRow(i);

			while (i < table.rows.length) {
				table.rows(i).className = (i & 1) ? "oddline" : "";
				i++;
			}
			g_Chg.Addons = true;
		}
	}
}

InitOptions = function ()
{
	ApplyLang(document);

	var InstallPath = fso.GetParentFolderName(api.GetModuleFileName(null));
	document.F.ButtonInitConfig.disabled = (InstallPath == te.Data.DataFolder) | !fso.FolderExists(fso.BuildPath(InstallPath, "layout"));
	for (i in document.F.elements) {
		if (!/=|:/.test(i)) {
			if (/^Tab_|^Tree_|^View_|^Conf_/.test(i)) {
				if (te.Data[i] !== undefined) {
					SetElementValue(document.F.elements[i], te.Data[i]);
				}
			}
		}
	}

	ResetForm();
	var s = [];
	for (var i in g_arMenuTypes) {
		s.push('<label id="tab2_' + i + '" class="button" style="width: 100%" onmousedown="ClickTree(this, null, \'Menus\');">' + GetText(g_arMenuTypes[i]) + '</label><br />');
	}
	document.getElementById("tab2_").innerHTML = s.join("");
	SetTab(dialogArguments.Data);
}

OpenIcon = function (o)
{
	setTimeout(function ()
	{
		var data = [];
		var a = o.id.split(/,/);
		if (a[0] == "b") {
			var dllpath = fso.BuildPath(system32, "ieframe.dll");
			var image = te.GdiplusBitmap;
			a[0] = fso.GetFileName(dllpath);
			var a1 = a[1];
			var hModule = LoadImgDll(a, 0);
			if (hModule) {
				var himl = api.ImageList_LoadImage(hModule, isFinite(a[1]) ? a[1] - 0 : a[1], a[2], 0, CLR_DEFAULT, IMAGE_BITMAP, LR_CREATEDIBSECTION);
				if (himl) {
					a[1] = a1;
					var nCount = api.ImageList_GetImageCount(himl);
					a[0] = fso.GetFileName(dllpath);
					for (a[3] = 0; a[3] < nCount; a[3]++) {
						var s = "bitmap:" + a.join(",");
						var src = MakeImgSrc(s, 0, false, a[2]);
						data.push('<img src="' + src + '" class="button" onclick="SelectIcon(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()" title="' + s + '"> ');
					}
					api.ImageList_Destroy(himl);
				}
				api.FreeLibrary(hModule);
			}
		}
		else {
			dllpath = fso.BuildPath(system32, "shell32.dll");
			var nCount = api.ExtractIconEx(dllpath, -1, null, null, 0);
			for (var i = 0; i < nCount; i++) {
				var s = "icon:shell32.dll," + i + "," + a[1];
				var src = MakeImgSrc(s, 0, false, a[1]);
				data.push('<img src="' + src + '" class="button" onclick="SelectIcon(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()" title="' + s + '"> ');
			}
		}
		o.innerHTML = data.join("");
		o.cursor = "";
		o.onclick = null;
		document.body.style.cursor = "auto";
	}, 1);
	document.body.style.cursor = "wait";
}


InitDialog = function ()
{
	var Query = dialogArguments.Query || location.search.replace(/\?/, "");
	if (api.strcmpi(Query, "icon") == 0) {
		var h = document.documentElement.clientHeight || document.body.clientHeight;
		h -= 60;
		if (h > 0) {
			document.getElementById("panel0").style.height = h + 'px';
		}
		var a =
		{
			"16px ieframe,206" : "b,206,16",
			"24px ieframe,204" : "b,204,24",
			"16px ieframe,216" : "b,216,16",
			"24px ieframe,214" : "b,214,24",
			"16px ieframe,699" : "b,699,16",
			"24px ieframe,697" : "b,697,24",

			"16px shell32" : "i,16",
			"32px shell32" : "i,32",

			"25px TRAVEL_ENABLED_XP" : "b,TRAVEL_ENABLED_XP.BMP,25",
			"30px TRAVEL_ENABLED_XP" : "b,TRAVEL_ENABLED_XP_120.BMP,30"
		};
		var s = [];
		for (var i in a) {
			s.push('<div id="' + a[i] + '" onclick="OpenIcon(this)" style="cursor: pointer"><span class="tab">' + i + '</span></div>');
		}
		document.getElementById("Content").innerHTML = s.join("");
	}
	if (api.strcmpi(Query, "mouse") == 0) {
		returnValue = false;
		var s = [];
		s.push('<input type="text" name="q" style="width: 100%" onkeydown="setTimeout(\'returnValue=document.F.q.value\',100)" />');
		s.push('<div id="Gesture" style="width: 100%; height: 340px; border: 1px gray solid; text-align: center" onmousedown="return MouseDown()" onmouseup="return MouseUp()" onmousemove="return MouseMove()" ondblclick="MouseDbl()" onmousewheel="return MouseWheel()"></div>');
		document.getElementById("Content").innerHTML = s.join("");
	}
	if (api.strcmpi(Query, "key") == 0) {
		returnValue = false;
		var s = [];
		s.push('<div style="padding: 8px;" style="display: block;"><label>Key</label><br /><input type="text" name="q" style="width: 100%; ime-mode: disabled" /></div>');
		document.getElementById("Content").innerHTML = s.join("");
		document.body.onkeydown = function ()
		{
			returnValue = GetKeyName(api.sprintf(10, "$%x", (api.MapVirtualKey(event.keyCode, 0) | ((event.keyCode >= 33 && event.keyCode <= 46 || event.keyCode >= 91 && event.keyCode <= 93 || event.keyCode == 111 || event.keyCode == 144) ? 256 : 0) | GetKeyShift())));
			document.F.q.value = returnValue;
			document.F.ButtonOk.disabled = false;
			return false;
		}
	}
	ApplyLang(document);
}

MouseDown = function ()
{
	var hwnd = api.GetWindow(document);
	if (g_Gesture) {
		var c = returnValue.charAt(returnValue.length - 1);
		var n = 1;
		for (i = 1; i < 4; i++) {
			if (event.button & n && g_Gesture.indexOf(i + "") < 0) {
				returnValue += i + "";
			}
			n *= 2;
		}
	}
	else {
		returnValue = GetGestureKey() + GetGestureButton();
	}
	document.F.q.value = returnValue;
	g_Gesture = returnValue;
	g_pt = {x: event.screenX, y: event.screenY};
	document.F.ButtonOk.disabled = false;
	var o = document.getElementById("Gesture");
	var s = o.style.height;
	o.style.height = "1px";
	o.style.height = s;
	return false;
}

MouseUp = function ()
{
	g_Gesture = GetGestureButton();
	return false;
}

MouseMove = function ()
{
	if (api.GetKeyState(VK_XBUTTON1) < 0 || api.GetKeyState(VK_XBUTTON2) < 0) {
		returnValue = GetGestureKey() + GetGestureButton();
		document.F.q.value = returnValue;
	}
	if (document.F.q.value.length && (api.GetKeyState(VK_RBUTTON) < 0 || (te.Data.Conf_Gestures && (api.GetKeyState(VK_MBUTTON) < 0)))) {
		var pt = {x: event.screenX, y: event.screenY};
		var x = (pt.x - g_pt.x);
		var y = (pt.y - g_pt.y);
		if (Math.abs(x) + Math.abs(y) >= 20) {
			if (te.Data.Conf_TrailSize) {
				var hdc = api.GetWindowDC(null);
				if (hdc) {
					api.MoveToEx(hdc, g_pt.x, g_pt.y, null);
					var pen1 = api.CreatePen(PS_SOLID, te.Data.Conf_TrailSize, te.Data.Conf_TrailColor);
					var hOld = api.SelectObject(hdc, pen1);
					api.LineTo(hdc, pt.x, pt.y);
					api.SelectObject(hdc, hOld);
					api.DeleteObject(pen1);
					api.ReleaseDC(te.hwnd, hdc);
				}
			}
			g_pt = pt;
			var s = (Math.abs(x) >= Math.abs(y)) ? ((x < 0) ? "L" : "R") :  ((y < 0) ? "U" : "D");
			if (s != document.F.q.value.charAt(document.F.q.value.length - 1)) {
				returnValue += s;
				document.F.q.value = returnValue;
			}
		}
	}
	return false;
}

MouseDbl = function ()
{
	returnValue += returnValue.replace(/\D/g, "");
	document.F.q.value = returnValue;
	return false;
}

MouseWheel = function ()
{
	returnValue = GetGestureKey() + GetGestureButton() + (event.wheelDelta > 0 ? "8" : "9");
	document.F.q.value = returnValue;
	document.F.ButtonOk.disabled = false;
	return false;
}

InitLocation = function ()
{
	ApplyLang(document);
	var info = GetAddonInfo(dialogArguments.Data.id);
	document.title = info.Name;
	var items = te.Data.Addons.getElementsByTagName(dialogArguments.Data.id);
	var item = null;
	if (items.length) {
		item = items[0];
		var Location = item.getAttribute("Location");
		if (!Location) {
			Location = window.Default;
		}
		for (var i = document.L.elements.length; i--;) {
			if (api.strcmpi(Location, document.L.elements[i].value) == 0) {
				document.L.elements[i].checked = true;
			}
		}
	}
	var locs = [];
	items = te.Data.Locations;
	for (var i in items) {
		locs[i] = [];
		for (var j in items[i]) {
			info = GetAddonInfo(items[i][j]);
			locs[i].push(info.Name);
		}
	}
	for (var i in locs) {
		var s = locs[i].join(", ").replace('"', "");
		try {
			document.getElementById('_' + i).innerHTML = '<input type="text" value="' + s + '" title="' + s + '" style="width: 85%">';
		} catch (e) {}
	}

	var oa = document.F.Menu;
	oa.length = 0;
	oa[++oa.length - 1].value = "";
	oa[oa.length - 1].text = GetText("Select");
	for (j in g_arMenuTypes) {
		var s = g_arMenuTypes[j];
		if (!/Default|Alias/.test(s)) {
			oa[++oa.length - 1].value = s;
			oa[oa.length - 1].text = GetText(s);
		}
	}
	var ar = ["Key", "Mouse"];
	for (i in ar) {
		var mode = ar[i];
		var oa = document.F.elements[mode + "On"];
		oa.length = 0;
		oa[++oa.length - 1].value = "";
		oa[oa.length - 1].text = GetText("Select");
		for (var j in MainWindow.eventTE[mode]) {
			oa[++oa.length - 1].text = GetTextEx(j);
			oa[oa.length - 1].value = j;
		}
	}
	if (item) {
		var ele = document.F.elements;
		for (var i = ele.length; i--;) {
			var n = ele[i].id || ele[i].name;
			if (n) {
				s = item.getAttribute(n);
				if (/Name$/.test(n)) {
					s = GetText(s);
				}
				if (n == "Key") {
					s = GetKeyName(s);
				}
				if (s || s === 0) {
					SetElementValue(ele[n], s);
				}
			}
		}
	}
	if (!dialogArguments.Data.show) {
		dialogArguments.Data.show = "6";
		dialogArguments.Data.index = 6;
	}
	if (/[8]/.test(dialogArguments.Data.show)) {
		MakeKeySelect();
		SetKeyShift();
	}
	var a = document.F.MenuName.value.split(/\t/);
	document.F._MenuName.value = GetText(a[0]);
	document.F._MenuKey.value = GetKeyName(a[1]) || "";

	try {
		var ar = dialogArguments.Data.show.split(/,/);
		for (var i in ar) {
			document.getElementById("tab" + ar[i]).style.display = "inline";
		}
		nTabIndex = dialogArguments.Data.index;
	} catch (e) {}
	SetImage();
	ClickTab(null, 1);
}

SetLocation = function()
{
	var items = te.Data.Addons.getElementsByTagName(dialogArguments.Data.id);
	if (items.length) {
		var item = items[0];
		item.removeAttribute("Location");
		for (var i = document.L.elements.length; i--;) {
			if (document.L.elements[i].checked) {
				item.setAttribute("Location", document.L.elements[i].value);
				te.Data.bReload = true;
				MainWindow.RunEvent1("ConfigChanged", "Addons");
				break;
			}
		}
		var ele = document.F.elements;
		var a = [GetSourceText(ele._MenuName.value)];
		if (ele._MenuKey.value) {
			var s = GetKeyKey(ele._MenuKey.value);
			if (s) {
				a.push(api.sprintf(10, "$%x", s));
			}
		}
		ele.MenuName.value = a.join("\t");
		if (dialogArguments.Data.show == "6") {
			ele.Set.value = "";
		}
		for (var i = ele.length; i--;) {
			var n = ele[i].id || ele[i].name;
			if (n && n.charAt(0) != "_") {
				if (n == "Key") {
					var s = GetKeyKey(document.F.elements[n].value);
					if (s) {
						document.F.elements[n].value = api.sprintf(10, "$%x", s);
					}
				}
				if (SetAttribEx(item, document.F, n)) {
					te.Data.bReload = true;
					MainWindow.RunEvent1("ConfigChanged", "Addons");
				}
			}
		}
	}
	window.close();
}

function SetAttrib(item, n, s)
{
	if (s) {
		item.setAttribute(n, s);
	}
	else {
		item.removeAttribute(n);
	}
}

function GetElementValue(o)
{
	if (o.type) {
		if (api.strcmpi(o.type, 'checkbox') == 0) {
			return o.checked ? 1 : 0;
		}
		if (/hidden|text/i.test(o.type)) {
			return o.value;
		}
		if (/select/i.test(o.type)) {
			return o[o.selectedIndex].value;
		}
	}
}

function SetElementValue(o, s)
{
	if (o.type) {
		if (api.strcmpi(o.type, "checkbox") == 0) {
			o.checked = api.LowPart(s);
			return;
		}
		if (/text/i.test(o.type)) {
			o.value = s;
			return;
		}
		if (/select/i.test(o.type)) {
			var i = o.length;
			while (--i >= 0) {
				if (o(i).value == s) {
					o.selectedIndex = i;
					break;
				}
			}
		}
	}
}

function SetAttribEx(item, f, n)
{
	var s = GetElementValue(f.elements[n]);
	if (s != GetAttribEx(item, f, n)) {
		SetAttrib(item, n, s);
		return true;
	}
	return false;
}

function GetAttribEx(item, f, n)
{
	if (/([^=]*)=(.*)/.test(n)) {
		s = item.getAttribute(RegExp.$1);
		if (s == RegExp.$2) {
			document.getElementById(n).checked = true;
		}
		return;
	}
	s = item.getAttribute(n);
	if (s || s === 0) {
		SetElementValue(f.elements[n], s);
	}
}

function RefX(Id, bMultiLine, oButton)
{
	setTimeout(function () {
		if (/Path/.test(Id)) {
			var s = Id.replace("Path", "Type");
			var o = GetElement(s);
			if (o) {
				var pt;
				if (oButton) {
					pt = GetPos(oButton, true);
					pt.y = pt.y + o.offsetHeight;
				}
				else {
					pt = api.Memory("POINT");
					api.GetCursorPos(pt);
				}
				var r = MainWindow.OptionRef(o[o.selectedIndex].value, GetElement(Id).value, pt);
				if (typeof r == "string") {
					var p = { s: r };
					MainWindow.OptionDecode(o[o.selectedIndex].value, p);
					if (bMultiLine && api.GetKeyState(VK_CONTROL) < 0 && api.ILCreateFromPath(p.s)) {
						AddPath(Id, p.s);
					}
					else {
						GetElement(Id).value = p.s;
					}
					o.onchange();
				}
			}
			return;
		}

		var path = OpenDialog(GetElement(Id).value);
		if (path) {
			if (bMultiLine) {
				AddPath(Id, path);
			}
			else {
				GetElement(Id).value = path;
			}
		}
	}, 100);
	g_Chg.Data = true;
}

function PortableX(Id)
{
	if (!confirmYN(GetText("Are you sure?"))) {
		return;
	}
	var o = GetElement(Id);
	var s = fso.GetDriveName(api.GetModuleFileName(null));
	o.value = o.value.replace(new RegExp('^("?)' + s, "igm"), "$1%Installed%").replace(new RegExp('( "?)' + s, "igm"), "$1%Installed%");
	o.onchange && o.onchange();
}

function GetElement(Id)
{
	var o = document.F.elements[Id];
	return o ? o : document.getElementById(Id);
}

function AddPath(Id, strValue)
{
	var o = GetElement(Id);
	var s = o.value;
	if (/\n$/.test(s) || s == "") {
		s += strValue;
	}
	else {
		s += "\n" + strValue;
	}
	o.value = s;
}

function GetCurrentSetting(s)
{
	var FV = te.Ctrl(CTRL_FV);

	if (confirmYN(GetText("Are you sure?"))) {
		AddPath(s, api.PathQuoteSpaces(api.GetDisplayNameOf(FV.FolderItem, SHGDN_FORPARSINGEX | SHGDN_FORPARSING)));
	}
}

function SetTab(s)
{
	var o = null;
	var arg = String(s).split(/&/);
	for (var i in arg) {
		var ar = arg[i].split(/=/);
		if (api.strcmpi(ar[0], "tab") == 0) {
			var s = GetText(ar[1]);
			var ovTab;
			for (var j = 0; ovTab = document.getElementById('tab' + j); j++) {
				if (api.strcmpi(s, ovTab.innerText) == 0) {
					o = ovTab;
					break;
				}
			}
		}
		else if (api.strcmpi(ar[0], "menus") == 0) {
			g_MenuType = ar[1];
		}
	}
	ClickTree(o);
}

function AddMouse(o)
{
	(document.F.elements["MouseMouse"] || document.F.elements["Mouse"]).value += o.title;
}

function InitAddonOptions()
{
	returnValue = false;
	LoadLang2(fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), "addons\\" + Addon_Id + "\\lang\\" + GetLangId() + ".xml"));

	ApplyLang(document);
	info = GetAddonInfo(Addon_Id);
	document.title = info.Name;
	var items = te.Data.Addons.getElementsByTagName(Addon_Id);
	if (items.length) {
		var item = items[0];
		var ele = document.F.elements;
		for (var i = ele.length; i--;) {
			var n = ele[i].id || ele[i].name;
			if (n) {
				GetAttribEx(item, document.F, n);
				if (/^Color_(.*)/.test(n)) {
					var o = document.F.elements[RegExp.$1];
					if (o) {
						ele[i].style.backgroundColor = GetWebColor(o.value);
					}
				}
			}
		}
	}
}

function SetAddonOptions()
{
	var items = te.Data.Addons.getElementsByTagName(Addon_Id);
	if (items.length) {
		var item = items[0];
		var ele = document.F.elements;
		for (var i = ele.length; i--;) {
			var n = ele[i].id || ele[i].name;
			if (n) {
				if (SetAttribEx(item, document.F, n)) {
					returnValue = true;
				}
			}
		}
	}
	window.close();
}

function MouseOver(o)
{
	if (o.className == 'button' || o.className == 'menu') {
		if (objHover && o != objHover) {
			MouseOut();
		}
		objHover = o;
		o.className = 'hover' + o.className;
	}
}

function SelectIcon(o)
{
	returnValue = o.title;
	document.F.ButtonOk.disabled = false;
	document.getElementById("Selected").innerHTML = o.outerHTML;
}

TestX = function (id)
{
	if (confirmYN(GetText("Are you sure?"))) {
		var o = document.F.elements[id + "Type"];
		var p = { s: document.F.elements[id + "Path"].value };
		MainWindow.OptionEncode(o[o.selectedIndex].value, p);
		MainWindow.Exec(te.Ctrl(CTRL_FV), p.s, o[o.selectedIndex].value);
	}
}

SetImage = function ()
{
	var h = api.LowPart(document.F.IconSize ? document.F.IconSize.value : document.F.Height.value);
	if (!h) {
		h = window.IconSize ? window.IconSize : 24;
	}
	var src = MakeImgSrc(document.F.Icon.value, 0, true, h);
	document.getElementById("_Icon").innerHTML = src ? '<img src="' + src + '" ' + (h ? 'height="' + h + 'px"' : "") + '>' : "";
}

ShowIcon = function ()
{
	var s = showModalDialog(fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), "script\\dialog.html"), {MainWindow: MainWindow, Query: "icon"}, 'dialogWidth: 640px; dialogHeight: 480px; resizable: yes; status: 0;');
	if (s) {
		document.F.Icon.value = s;
		if (document.F.Icon.onchange) {
			document.F.Icon.onchange();
		}
		SetImage();
	}
}

function SelectLangID(o)
{
	var i = 0;
	var Langs = [];
	var FindData = api.Memory("WIN32_FIND_DATA");
	var hFind = api.FindFirstFile(fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), "lang\\*.xml"), FindData);
	var bFind = hFind != INVALID_HANDLE_VALUE;
	while (bFind) {
		Langs.push(FindData.cFileName.replace(/\..*$/, ""));
		bFind = api.FindNextFile(hFind, FindData);
	}
	api.FindClose(hFind);
	Langs.sort();
	var path = fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), "lang\\");
	var hMenu = api.CreatePopupMenu();
	for (i in Langs) {
		var xml = te.CreateObject("Msxml2.DOMDocument");
		xml.async = false;
		var title = Langs[i];
		xml.load(path + title + '.xml');
		var items = xml.getElementsByTagName('lang');
		if (items && items.length) {
			var item = items[0];
			var en = item.getAttribute("en");
			if (en && api.strcmpi(item.text, en)) {
				en = ' / ' + en;
			}
			else {
				en = '';
			}
			title = item.text + en + " (" + title + ")\t" + item.getAttribute("author");
		}
		api.InsertMenu(hMenu, i, MF_BYPOSITION | MF_STRING, api.QuadPart(i) + 1, title);
	}
	var pt = GetPos(o, true);
	var nVerb = api.TrackPopupMenuEx(hMenu, TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y + o.offsetHeight, te.hwnd, null, null);
	if (nVerb) {
		document.F.Conf_Lang.value = Langs[nVerb - 1];
	}
	api.DestroyMenu(hMenu);
}

function GetTextEx(s)
{
	var ar = s.split(/_/);
	var s = GetText(ar.shift());
	if (ar && ar.length) {
		s += "(" + GetText(ar.join(" ")) + ")";
	}
	return s;
}
