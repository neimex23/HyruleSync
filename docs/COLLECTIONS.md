# Collections inside Inventory

**Summary** includes armor, upgrade tiers, memories, fabrics, horse equipment, completion rewards and monster medals. Medals distinguish claimed rewards from those ready to claim. Each shortcut opens the corresponding section. Unknown progress stays separate from missing progress. These counters are not the official map percentage.

The armor plan selection and target tier are saved in `.state/settings.json` beside the executable, surviving browser changes and app restarts. The plan is shared across inspected saves and recalculates costs using the active snapshot's inventory. Failed writes are reported with a retry button; changes remain available in the current window.

Choose an Inventory subtab:

- **Pouches** shows your currently carried items.
- **Armor** lists all 135 obtainable pieces with images, ownership and upgrade levels. Search or filter missing pieces, and expand **Where to get it** for sources and an external guide.
- **Other collections** offers illustrated selectors for Memories, Paraglider fabrics, Horse equipment and Completion rewards. One collection is shown at a time.
- **Monster medals** groups bosses by the six medals, with remaining enemies and **View on map** buttons.

## Calculate upgrades

1. Tick **Include in plan** on armor pieces.
2. Open **Your upgrade plan** and choose a target star level.
3. Read the rupee balance and material table: Required, Owned and Missing. Expand long material lists by clicking their heading.

Selection starts empty on first use. **Select owned pieces** prepares a plan for carried armor. **Clear selection** starts again. All remaining tiers are added before inventory is deducted once from the total. Duplicate pieces use the highest owned level; lowered and raised Hylian Hoods are treated as one piece. The Ancient Hero's Aspect uses its special full-body rupee costs. Missing pieces can be planned from base level. Purchase costs and fairy fountain unlocks are excluded.

Armor ownership reflects the current pouch, so sold pieces appear missing. Other collections use acquisition flags. Fabrics include the default fabric and five additional sage fabrics from version 1.4; older saves can lack their fields. Horse equipment covers 11 collectible items and excludes horses' default equipment. Unsupported fields remain unknown. Defeating every boss and claiming a medal are separate states; **Ready to claim** requires verified defeats and a confirmed unclaimed medal.

Live tracking and inspected saves share the same snapshot. No save editing occurs. Names, sources and costs are bundled for offline use. Reference images and guide links require internet; failed images fall back to local pictograms. See the third-party notices for source revisions and image provenance.

Missing and unverified collection images are blurred, including when no save is loaded. Click **Click to reveal** to show one image and **Blur again** to hide it; keyboard activation also works. Revealing never changes collection progress. Collection selector thumbnails prefer owned items and conceal unverified ones. Images become protected again when an item changes from owned to missing after switching saves.
