# Morning Light - Development Changelog

## Overview
Morning Light is a bilingual devotional web app that was originally dependent on Cloudinary CDN for content delivery. This changelog documents the migration to a decentralized, GitHub-based data hosting system with automated manifest generation.

## Major Changes

### Phase 1: App Migration from Cloudinary to Local GitHub Hosting
**Date:** November 28, 2025

**Objective:** Disconnect from remote CDN hosting and enable instant content updates without manual manifest editing.

**Changes Implemented:**
- **Created new GitHub repository:** `morning-light-devotions-data` for storing all devotion JSON files
- **Migrated all JSON files:** Moved 19 devotion files (9 dates × 2 languages each + manifest) from local `src/data/` to `https://github.com/devasudanT/morning-light-devotions-data`
- **Updated app data sources:** Changed all `fetch()` URLs in `index.tsx` from Cloudinary to GitHub raw URLs:
  - From: `https://res.cloudinary.com/devasudan/raw/upload/v1764103222/morning-light/`
  - To: `https://raw.githubusercontent.com/devasudanT/morning-light-devotions-data/main/data/`

**Specific Files Modified:**
- `index.tsx`: Updated 3 fetch locations to use GitHub URLs
  - Manifest fetch (line ~434)
  - Individual devotion fetch (line ~476)
  - Search pre-fetch fetch (line ~394-408)

### Phase 2: Automated Manifest Generation
**Date:** November 28, 2025

**Objective:** Eliminate manual `manifest.json` updates for new devotions.

**Changes Implemented:**
- **Created automation script:** `generate-manifest.js`
  - Parses devotion filenames for dates (DD-MM-YYYY format)
  - Extracts titles from JSON meta blocks
  - Generates proper manifest.json structure
  - Uses ES modules for compatibility

- **Implemented GitHub Actions workflow:** `.github/workflows/update-manifest.yml`
  - Triggers on push of JSON files to data/ folder (except manifest.json)
  - Automatically runs manifest generation
  - Commits updated manifest.json back to repository

**Workflow Details:**
- Event trigger: Push to `data/*.json` (excluding `manifest.json`)
- Actions: Checkout code → Setup Node.js → Generate manifest → Auto-commit changes
- Eliminates need for manual manifest editing

## File Structure Changes

### Data Repository (morning-light-devotions-data)
```
morning-light-devotions-data/
├── generate-manifest.js           # Auto-manifest generator
├── .github/
│   └── workflows/
│       └── update-manifest.yml    # GitHub automation
└── data/
    ├── XXX-XX-XXXX-EN.json        # English devotion files
    ├── XXX-XX-XXXX-TA.json        # Tamil devotion files
    └── manifest.json              # Auto-generated index (DO NOT EDIT)
```

### App Repository (morning-light)
```
morning-light/
├── index.tsx                      # Updated with GitHub URLs
├── generate-manifest.js           # Reference copy for documentation
└── .github/
    └── workflows/
        └── update-manifest.yml    # Reference copy for documentation
```

## Migration Impact

### Benefits Achieved
- ✅ **Zero External Dependencies:** No more Cloudinary CDN costs/limits
- ✅ **Instant Content Updates:** New devotions appear immediately after push
- ✅ **Automated Maintenance:** manifest.json updates automatically
- ✅ **Version Control:** All content in Git, full history tracking
- ✅ **Cost-Free Hosting:** GitHub handles raw file serving
- ✅ **Scalable Architecture:** Supports 5+ years of daily updates

### Developer Workflow Change
**Before:**
1. Write devotion JSON
2. Manually update manifest.json
3. Commit both files
4. Push to repo → Deploy on Vercel

**After:**
1. Write devotion JSON
2. Commit just the JSON file(s)
3. Push to data repo → Automation generates manifest → Deploy skipped, app shows instantly

## Technical Details

### Data JSON Structure
Each devotion file is an array of content blocks:
```json
[
  {
    "type": "meta",
    "title": "Devotion Title",
    "subtitle": "",
    "language": "English|Tamil",
    "date": "YYYY-MM-DD",
    "youtubeUrl": "...",
    "pdfUrl": "",
    "imageUrl": ""
  },
  {
    "type": "verse|paragraph|lesson|prayer",
    "content": "...",
    "reference": "... (for verses)"
  }
]
```

### Manifest JSON Structure
Auto-generated index of available devotions:
```json
[
  {
    "date": "YYYY-MM-DD",
    "EN": {"title": "English Title"},
    "TA": {"title": "Tamil Title"}
  }
]
```

## Future Considerations

### Content Management
For enhanced content creation, consider:
- Rich text editor integration in the app
- Form-based JSON generation
- Validation for devotion structure

### Analytics
Monitor usage with GitHub's repository insights or add telemetry if needed.

### Backup
GitHub repository serves as backup - all content versioned and recoverable.

## Lessons Learned

1. **Don't underestimate automation:** Moving from manual to automated manifest saved significant maintenance overhead for frequent updates.

2. **GitHub as CDN:** Reliable and cost-effective for static JSON hosting when GitHub's rate limits are considered.

3. **Separation of concerns:** Keeping data in separate repository from code enables independent deployment cycles.

4. **Browser limitations:** Client-side fetching well-suited for workflows that don't require file system access.

---

**Migration Status:** ✅ COMPLETE
**Date Completed:** November 28, 2025
**Maintained by:** Cline
