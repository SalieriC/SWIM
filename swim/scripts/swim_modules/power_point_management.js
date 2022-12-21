/*******************************************
 * Power Point Management (remaster)
 * // v.0.0.1
 * By SalieriC#8263
 ******************************************/
export async function power_point_management_script() {
    /**
     * General Path: actor.system.powerPoints.general
     * Specific Paths: actor.system.powerPoints["AB Name"]
     * Properties in the object:
     * - actor.system.powerPoints.general.max
     * - actor.system.powerPoints.general.value
     * - actor.system.powerPoints["AB Name"].max
     * - actor.system.powerPoints["AB Name"].value
     * 
     * ABs that never got PP entered in their pool do NOT appear in the properties. Those which had them once but do no longer are set to `null`.
     * 
     * Roadmap:
     * [] Always prefer changing specific PP pool.
     * [] But use general if general has pp and specific one is empty.
     * [] Add flag settings for Powers to further configure them?
     * [] Cover Arcane Devices and such by using additional stats on powers rather than the systems real ones. (Automatically add/remove pp additional stat on flag change?)
     */
}