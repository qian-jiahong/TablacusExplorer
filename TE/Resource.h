#define PRODUCTNAME				"Tablacus Explorer"

#ifndef IDC_STATIC
#define IDC_STATIC (-1)
#endif

//Version
#define STRING(str) STRING2(str)
#define STRING2(str) #str
#ifdef _EXE
//Version(EXE)
#define VER_Y		25
#define VER_M		4
#define VER_D		8
#else
//Version(DLL)
#define VER_Y		25
#define VER_M		5
#define VER_D		15
#endif

//Icon
#define IDI_TE		1

//Define
//#define USE_TEOBJ
//#define USE_SHELLBROWSER
//#define USE_OBJECTAPI
//#define USE_APIHOOK
//#define USE_HTMLDOC
//#define USE_TESTOBJECT
//#define USE_TESTPATHMATCHSPEC
//#define CHECK_HANDLELEAK
//#define USE_LOG
#define EMULATE_XP	//FALSE &&
#ifndef _WIN64
#define _2000XP
//#define _W2000
#endif
#ifdef _DEBUG
#define _EXEONLY
#endif
