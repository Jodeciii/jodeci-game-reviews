# JODECI — Game Reviews

A complete, responsive personal video-game review website. No installation, npm, paid hosting, build step, or database is required.

## First: view your website

1. Unzip `jodeci-game-reviews-v15.zip`.
2. Open `index.html` in Chrome, Edge, Firefox or Safari.
3. Browse the homepage, review archive, individual review pages, rating guide.
4. Open `studio.html` to edit review content and add new reviews.

**IMPORTANT:** The two initial entries are **DRAFT / example write-ups** based on the owner's stated opinions, not the full final reviews. Replace or revise their text in the Review Studio before publication. The owner has rated Phantom Blade Zero **4/5 (Great)** and 007 First Light **5/5 (Excellent)**.

## Publish for FREE with GitHub Pages

1. Sign up or log in at <https://github.com/>.
2. Click **New repository**. Name it e.g. `game-reviews`, set it to **Public**, then **Create repository**.
3. In your repository select **Add file → Upload files**. Unzip your site first, then drag in the **contents** of the `jodeci-game-reviews` folder: `index.html`, `studio.html`, `app.js`, `studio.js`, `richtext.js`, `media-store.js`, `seo-pages.js`, `styles.css`, `reviews.js`, `assets` folder (including `favicon.svg`), and optionally `README.md` and `.nojekyll`. **Do not upload only the ZIP file**.
4. Click **Commit changes**.
5. In the repository, open **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/(root)`, then click **Save**.
6. Once published, the site URL will usually be `https://YOUR-USERNAME.github.io/game-reviews/` (replace YOUR-USERNAME with your GitHub name).

This is an example URL, not a live site yet. See official documentation: <https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site>.

## Add or update reviews, without coding

1. Open your live site's `studio.html` (e.g. `https://YOUR-USERNAME.github.io/game-reviews/studio.html`) or open the local `studio.html` file.
2. Select an existing review or **+ NEW REVIEW**.
3. Write your review. The editor now **autosaves to this browser** about 2 seconds after edits stop. **SAVE IN BROWSER** remains available for an immediate manual save. Version History provides local recovery snapshots. These saves do not update the live website.
4. When ready, enter the final published website URL in the Studio sidebar (e.g. `https://YOUR-USERNAME.github.io/game-reviews/`) and click **DOWNLOAD WEBSITE UPDATE ZIP**. It downloads `reviews.js`, referenced PC-uploaded images/GIFs, individual `/review/*.html` pages with social sharing metadata, `sitemap.xml` and `robots.txt`. Keep the ZIP as a backup.
5. Extract the update ZIP into your website folder. Upload the `reviews.js`, `assets/uploads/` files (if any), `/review/*.html` files, `sitemap.xml` and `robots.txt` to your GitHub repository, preserving their paths. The database file must be named **exactly** `reviews.js`.
6. GitHub Pages will republish your site after the new commit. Refresh the site to see changes.

Tip: On a second device, the Review Studio does not automatically know about unsent edits made in your first device's browser. Keep your downloaded `reviews.js` and publish after editing.

## Add images

The sample reviews use remote promotional art URLs. These could change or stop working. For reliability and control, use images you've obtained permission to publish or that are approved for editorial use:

1. In Review Studio choose an image file from your PC using **Game art** or use the IMG / GIF toolbar button. You may also paste an HTTPS URL.
2. Save your review and select **DOWNLOAD WEBSITE UPDATE ZIP**.
3. Extract the downloaded update ZIP inside the website folder (and later upload its contents to GitHub). It preserves the correct `assets/uploads/` paths.

If images fail to load, the site still displays a themed fallback and game title.

## Content and privacy

- `index.html` is the public website, dynamically reading the game entries in `reviews.js`.
- `studio.html` is a convenient client-side editor, **not a locked admin panel**. Anyone can open it, but only someone with repository write access can publish changes to the live website.
- No visitor comments, accounts, analytics, tracking or data collection are built in.
- The optional remote Google Fonts and game promotional art need an internet connection; local fallback fonts and color backgrounds work offline.
- For privacy, don't include private information in your public repository.
- Rating system: 💩 Abysmal (special), ☆☆☆☆☆ Awful (0), ★☆☆☆☆ Bad (1), ★★☆☆☆ Okay (2), ★★★☆☆ Good (3), ★★★★☆ Great (4), ★★★★★ Excellent (5), and 🌟 Masterpiece (special). Studio supports both special ratings.
- Standout Moments on review pages start behind a spoiler disclosure.

## File structure

```
index.html         public homepage, reviews, rating guide
studio.html        visual review editor
styles.css         site layout, typography, responsive styling
app.js             search, filters, routing and reviews display
richtext.js        safe formatting, links and media rendering
studio.js          rich-text editor, autosave, local revision history, export
media-store.js     local media library and ZIP exporter
seo-pages.js       generates per-review HTML, social tags, sitemap and robots.txt
reviews.js         editable game review database
assets/favicon.svg brand icon
.nojekyll          helps Github Pages serve static files unchanged
README.md          these instructions
```

## Customize the visual style

In `styles.css`, adjust the CSS variables at the top, especially `--bg`, `--accent`, `--text` and `--panel`. Edit branding text in `index.html` and `studio.html`.

## Visual updates (v4)

- Slogan uses matching uppercase banner typography.
- About page and homepage philosophy block removed; navigation now has Home, Reviews and Ratings.
- Removed the banner pulse dot; article metadata uses slash separators.
- Ratings headline now reads “Every Star Is Earned.”
- Ratings are subtly shaded with low-opacity, rarity-inspired gradients, from deep red to muted gold.

## Visual updates (v5)

- Review structure now uses only The Positives, The Negatives, Standout Moments (spoiler-hidden), and Overall Verdict.
- Removed the discontinued “What I Would Change” section from review pages, table of contents, sample data, editor, and exported files (including older browser drafts).
- The homepage divider/ticker is intentionally unchanged while its wording is being decided.

## Editor updates (v7)

- Removed Genre and Image Credit from review displays, the editor and exported entries. Older browser-saved drafts are cleaned automatically on load.
- Review Studio now offers all eight ratings in one dropdown, including 🌟 Masterpiece and 💩 Abysmal; the former special-rating checkboxes are gone.
- Existing review data remains compatible with the site (special ratings are saved with the same flags used by previous versions).

## Rich-text editing and embedded media (v8)

The opening paragraph, Positives, Negatives, Standout Moments and Overall Verdict now include a rich-text toolbar. Select text and choose **Bold, Italic, Underline, Strikethrough, Subheading, Quote, Bullets, Numbered list, Link**, or insert an **Image, GIF or Video**. Standard Ctrl+B/Ctrl+I/Ctrl+U shortcuts also work. Formatting appears on published review pages. Previously written plain-text reviews remain compatible.

- **Images and GIFs:** Use IMG or GIF to insert an HTTPS image, existing `assets/` filename, or a file from your PC. There is no artificial 1 MB limit. PC uploads are saved in a separate browser media library (IndexedDB), *not* embedded into `reviews.js`. Use **DOWNLOAD WEBSITE UPDATE ZIP** to export `reviews.js` and all local media files together. You must extract the ZIP into your site folder (including `assets/uploads/`) when publishing. Browser storage and GitHub file-size restrictions still apply.
- **Videos:** The Video button supports YouTube, Vimeo, direct HTTPS `.mp4`/`.webm`, or local `assets/clip.mp4` filenames. Local video files are **not** automatically uploaded; add them to `assets/` yourself and upload them with `reviews.js` when publishing. For large clips, YouTube/Vimeo is usually easier.
- **Publishing:** After saving in Review Studio, download and extract the Website Update ZIP. If you used `assets/` paths for media, those files must also exist on GitHub.
- **Security:** The site allows only a narrow set of formatting tags, HTTPS images/links and supported video embeds in reviews. Arbitrary scripts and iframe addresses are removed.
- **Offline:** Rich-text formatting and local image/GIF inserts work offline when the browser permits storage for the opened site. Remote image and video embeds require internet access.
- **Note:** Since the editor runs inside your browser with local storage, this is intended for a personal site, not collaboration or large media hosting. Back up your exported `reviews.js`.

## Editor improvements and interactive review elements (v9)

- **Subheading + Quote:** Select text or place the cursor on the line, then click `H` or `“”`. Click the same control again to switch back to a normal paragraph. The `×` button also clears headings and common block formatting along with bold/italic. `Ctrl+Z` uses the browser's undo history.
- **Inline spoiler:** Select only the words you want hidden, click **SPOILER**, and save. Published readers click/tap the highlighted words to reveal them (or press Enter/Space when focused with a keyboard). Click SPOILER again on text already marked as a spoiler to remove the effect.
- **Collapsible spoiler box:** Place the cursor, or select some text, and click **HIDE BOX**. Type inside its content area. The box is open for editing in Review Studio but starts collapsed when readers open the review. The entire Standout Moments section also remains spoiler-hidden as before.
- **Seven reusable callout boxes:** Put the cursor anywhere in any rich-text section and click `!` **Important**, `?` **Question**, `TIP`, `i` **Note**, `EX` **Example**, `⚡` **Hot Take**, or `↔` **Comparison**. For ordinary note boxes, selected text moves into the box; Example instead keeps the point outside the box and inserts a linked example immediately below it. Every kind has its own low-key color and icon. You can insert multiple boxes in the same section.
- **Divider:** Use `—` to insert a subtle horizontal line between ideas.
- **Export:** All the new content is saved in `reviews.js` alongside the rest of the review. Text callouts themselves do not require extra media files. PC-uploaded media is included in your Website Update ZIP.

These tools use the browser's built-in rich-text editing support. For selections that cross multiple paragraphs, spoilers may be split into separately clickable segments; for best control, select the exact words in a single paragraph. Always test your most elaborate layouts before publishing and keep a backup of your exported reviews.


### v10 editor notes
- The `!` Important box uses a muted red accent.
- Clicking a callout icon when the caret is in the matching callout deletes the **entire box and everything inside it**. Clicking a different icon changes the box style in place.
- Editorial boxes and spoiler boxes are top-level blocks and cannot be nested.
- The comparison tool inserts an editable two-column side-by-side layout **only inside Review Studio**. Published comparisons are read-only.
- `The Verdict` in the review contents aligns with the verdict card, and its rating label is enlarged.


## v12: publishing local media and examples

1. Write or update your review in `studio.html` and insert images/GIFs with IMG/GIF, including inside any note, Example, spoiler or Comparison box. For video use the VIDEO button and paste a YouTube, Vimeo or MP4/WebM URL (or a video already present in `assets/`).
2. Click **SAVE IN BROWSER** to store the edited review. Uploaded images are stored separately in this browser’s IndexedDB; saving the review keeps only its path.
3. Click **DOWNLOAD WEBSITE UPDATE ZIP**. The ZIP contains a new `reviews.js` and any uploaded images or GIFs referenced by saved reviews. Extract it **inside your website directory** so the `assets/uploads/` path is preserved. For GitHub, upload/replace the same files in your repository.
4. Keep this ZIP as a backup: clearing browser data or using another device/browser may remove your local media library. `reviews.js` by itself is not enough to restore PC-uploaded media.

**Important:** If you include a PC upload then use the ZIP export, not reviews.js-only. Uploaded media may be large; your browser must have enough storage, and GitHub’s limits still apply. The Example card replaces Highlight in the toolbar, but old Highlight cards remain readable. You can place image/GIF/video embeds inside Example, Important, Question, Tip, Note, Hot Take, Comparison (both columns), and spoiler boxes.

### Context-linked Example boxes

The **EX** button inserts an Example connected to the paragraph or point immediately above it. In a published review, a small **↳ Example** link appears immediately above the card. Clicking it scrolls to and briefly highlights the example. A compact Example link immediately above the card visually connects the point and its evidence, without a line. In Studio, put the cursor anywhere inside the statement you want to illustrate and click EX; the point is kept intact and an Example is inserted immediately after its paragraph. No manual anchor links are needed. Example boxes can include images, animated GIFs and video embeds just like other callouts. If another callout separates the point from the example, move the Example directly below the intended statement.

## v13: Editor refinements

- **Example layout:** Published examples now display a small `↳ Example` link directly before the card, only when there is a preceding point. The disconnected connector and “connected to the point above” label were removed. Click the link to jump to and highlight the card.
- **Persistent editing controls:** Every review section's toolbar stays visible beneath the site header as you scroll through a long entry. The tool row is horizontally scrollable; use the two arrow buttons beside it to reach the remaining tools. The current section name and active formatting states are shown in the toolbar.
- **Draft safeguards:** Studio marks entries with unsaved changes and warns before discarding them or leaving. Save before exporting; the export buttons now refuse to export stale content. If browser storage is unavailable, saving still updates the in-session data so you can export a backup immediately.
- **Minor polish:** The example card uses tighter spacing, the tool palette has keyboard and mouse scroll controls, and the card preview is labeled accurately.


## Image galleries / slideshow (v14)

Open `studio.html`, put your cursor where the gallery should appear, and click **GALLERY** in the Media toolbar. Choose multiple images or GIFs from your computer, paste image URLs one per line, add captions, and drag the items to change their order (or use the up/down arrows). Click **Insert Gallery**. To edit a gallery later, double-click it in Studio. Save the review and use **Download Website Update ZIP** so all uploaded media goes into `assets/uploads/` alongside `reviews.js`.

On the public site, readers can use next/previous buttons, thumbnails and mobile swipes; clicking an image opens a fullscreen viewer with arrow-key navigation, captions, and Escape to close. Single images also open fullscreen when clicked.

Empty paragraphs left by the editor immediately after images and galleries are removed during export. Keep a copy of your media ZIP as a backup; uploaded media is temporarily held in this browser until export.


## v15 — usability and publishing updates

### Galleries and image layouts

The **GALLERY** editor now offers four layouts:

- **Slideshow:** an automatic, looping gallery, advancing approximately every **3 seconds**. Crossfades take approximately 0.7 seconds. Reader interaction with arrows, thumbnails, or swipe permanently pauses that gallery's automatic transitions until the review is reloaded. The slideshow does not autoplay when outside the viewport, while the tab is hidden, or when reduced motion is requested.
- **Side by side:** paired images in two columns (one column on mobile).
- **Photo grid:** two-column editorial image layout; stacked on narrow screens.
- **Cinematic stack:** full-width images in a vertical sequence, each with an optional caption.

Readers may click any image to open the fullscreen viewer. In Studio, **click a single image and press Delete or Backspace** to remove it. Inside a gallery, Delete removes the **selected gallery image**; if only one image remains, it becomes a regular image. Double-click a gallery to open its editing and reordering dialog. Extra media-related blank paragraphs are still cleaned during serialization.

The review's large artwork now uses `object-fit: contain`, preserving the entire source image without cutting the sides. Smaller archive thumbnails retain a controlled crop to fit their card format. The redundant large artwork title overlay is removed; the actual review heading remains.

### Autosave and version history

Review Studio autosaves valid existing reviews approximately **1.8 seconds after editing stops**, using the same browser's local storage. Newly created reviews can be recovered from a separate local draft slot until first saved. **Version History** keeps up to **12 local snapshots per review**: older versions are available for restoration via the RESTORE button. Manual saves also create snapshots. Autosaving or restoring **does not publish anything to GitHub**. The exported Website Update ZIP remains the portable backup; local storage and local version history can be lost if you clear browser data, switch devices/browsers, or exceed storage quotas.

### Reading and sharing

- Long articles show a **thin reading progress bar** at the top and a floating **Back to top** button after scrolling down.
- Reviews have a **Share Review** control; each section heading has a copy-link icon. Section URLs look like `/review/your-game.html?section=negatives` and scroll to the intended section when opened.
- Per-review share pages are automatically created by **Download Website Update ZIP** for **published (non-draft)** reviews. These HTML pages include per-review titles, descriptions, canonical URLs, Open Graph and Twitter preview tags, JSON-LD structured review data, and the normal interactive website files. The ZIP also includes a sitemap and robots.txt when a valid HTTPS site URL is supplied.
- **IMPORTANT:** In Studio's sidebar, set **Your Website URL** to the **exact** GitHub Pages URL or custom domain **once it is known**, and export again. Social previews need a real public HTTPS site and appropriate artwork URLs. Search engines and social services may take time to index or refresh their caches. The site cannot render a public social preview from a local `file://` address.

### Limitations and safety

- The editor is **client-side**, not a password-protected online admin system. Publishing still requires uploading the exported files to GitHub Pages.
- Media added from your computer is stored in browser IndexedDB and exported separately; keeping large uploads can hit browser/GitHub storage limits. The site does not automatically host video files.
- Update your website with **the Website Update ZIP**, not `reviews.js` alone, when using local images or wanting shareable per-review pages.
- JavaScript-enhanced article layouts and gallery interactions may be indexed differently by search engines. Search previews are not guaranteed; per-page metadata improves compatibility, not indexing guarantees.


## v16 — visual fixes and reading controls

- **Hero cover:** Artwork on individual reviews now uses natural proportions rather than being contained in a fixed-height card. Its display is capped at **1000 × 1000 CSS pixels** (and restricted to the viewport height), but originals are not re-encoded or downsampled. The previous black/color letterboxing is removed. Smaller archive card thumbnails retain their crop by design.
- **Slideshows:** Autoplay now advances every **3 seconds**, looping smoothly with the existing 0.7-second crossfade. Using arrows, thumbs, swipes or opening fullscreen stops autoplay for that gallery until reloading the page. Reduced-motion preferences, hidden tabs and off-screen galleries remain respected.
- **Reading progress:** The thin orange progress **track** appears at the very top of every review, even at 0%; its fill advances as the reader scrolls through the review including the introduction. The Back to Top button appears after roughly 320px of scrolling and is hidden on non-review pages.
- **Section share icons:** Removed from article headings. To share an individual section, hover or focus on its entry under **In This Review** and use the small copy-link control. On touchscreens the control remains visible. The standalone **Share Review** button is unchanged.


## v17 galleries

Each review can have an optional **In-game gallery**, displayed prominently between its introduction and The Positives. Open Studio, choose a review, then click **+ ADD / EDIT GALLERY**. The original regular inline gallery tool remains available for any other review section. Changes to the dedicated gallery are saved in the `showcase` field inside `reviews.js`, and locally uploaded media is still exported under `assets/uploads/` with **Download Website Update ZIP**. Inline and fullscreen galleries now crossfade, thumbnail hovering selects images on pointer devices, and inline autoplay pauses on manual interaction. The editor toolbar shows all desktop controls in wrapped rows; mobile uses Text/Media/Extras/Boxes tabs rather than sideways scrolling.
