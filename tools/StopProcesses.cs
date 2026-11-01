using System;
using System.Diagnostics;
using System.Linq;
using System.Threading;
using System.Windows.Forms;

// This helper only targets exact HyruleSync process names in the current Windows session.
// It never reads or writes save files and never targets the game or browser.
public static class StopProcesses {
    [STAThread] public static int Main(string[] args) {
        Locale.Configure(args);
        int stopped=0, failed=0;
        int session=Process.GetCurrentProcess().SessionId;
        var targets=Process.GetProcessesByName("HyruleSync").Where(p=>p.SessionId==session).ToArray();
        foreach(var process in targets) {
            try {
                using(var signal=EventWaitHandle.OpenExisting("Local\\HyruleSync.Stop."+process.Id))signal.Set();
            } catch(WaitHandleCannotBeOpenedException) { /* Older versions do not have a stop event. */ }
              catch(UnauthorizedAccessException) { /* Try the normal process permissions below. */ }
        }
        DateTime grace=DateTime.UtcNow.AddMilliseconds(2000);
        foreach(var process in targets)using(process) {
            try {
                int wait=Math.Max(0,(int)(grace-DateTime.UtcNow).TotalMilliseconds);
                if(!process.WaitForExit(wait))process.Kill();
                if(process.WaitForExit(2000))stopped++;else failed++;
            } catch(InvalidOperationException) { stopped++; }
              catch { failed++; }
        }
        if(!args.Contains("--quiet")) {
            string message=targets.Length==0
                ?Locale.T("No hay procesos de HyruleSync abiertos.","No HyruleSync processes are running.")
                :Locale.T("Procesos de HyruleSync cerrados: ","HyruleSync processes stopped: ")+stopped;
            if(failed>0)message+=Locale.T("\nNo se pudieron cerrar: ","\nCould not stop: ")+failed+Locale.T(". Puede que otra instancia se haya iniciado con permisos diferentes.",". Another instance may be running with different permissions.");
            MessageBox.Show(message,"HyruleSync",MessageBoxButtons.OK,failed>0?MessageBoxIcon.Warning:MessageBoxIcon.Information);
        }
        return failed==0?0:1;
    }
}
