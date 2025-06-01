The files in this directory were copied from the
[Starlight Components](https://github.com/withastro/starlight/tree/main/packages/starlight/components) for
several reasons:

1. **Enable Font Awesome Icons**\
   The `SidebarSublist` component doesn't support icons to be displayed. The customizations in this component
   read the icon from the `attrs` property for the item and then adds them as prefixes to the navigation
   item.

   `SidebarRestorePoint.astro` had to be manually added (and is a straight copy) as it wasn't exported in the
   Starlight package.

2. **Reverse Sort Seasons**
   The `Sidebar` componenet has specialized coding to reverse order the `Seasons` navigation item to put the
   most recent year at the top.