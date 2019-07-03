#include <stdio.h>
#include "convar.h"
#include "source_map_thumbnail.h"

SourceMapThumbnail g_SourceThumbnail;

ICvar *icvar = NULL;

ConVar *g_cDrawHud;

PLUGIN_EXPOSE(SourceMapThumbnail, g_SourceThumbnail);

bool SourceMapThumbnail::Load(PluginId id, ISmmAPI *ismm, char *error, size_t maxlen, bool late)
{
	PLUGIN_SAVEVARS()

	GET_V_IFACE_CURRENT(GetEngineFactory, icvar, ICvar, CVAR_INTERFACE_VERSION);

	g_cDrawHud = icvar->FindVar("cl_drawhud");

	g_cDrawHud->m_nFlags = 0;

	return true;
}


bool SourceMapThumbnail::Unload(char *error, size_t maxlen)
{
	return true;
}

const char *SourceMapThumbnail::GetLicense()
{
	return "GPL 3.0";
}

const char *SourceMapThumbnail::GetName()
{
	return "Source Map Thumbnail";
}

const char *SourceMapThumbnail::GetAuthor()
{
	return "rumblefrog";
}

const char *SourceMapThumbnail::GetDescription()
{
	return "Helper to generate thumbnail images of maps";
}

const char *SourceMapThumbnail::GetURL()
{
	return "https://github.com/rumblefrog/Source-Map-Thumbnails";
}
 
const char *SourceMapThumbnail::GetVersion()
{
	return "2.0.0";
}

const char *SourceMapThumbnail::GetLogTag()
{
	return "Source Map Thumbnail";
}

const char *SourceMapThumbnail::GetDate()
{
	return __DATE__;
}


