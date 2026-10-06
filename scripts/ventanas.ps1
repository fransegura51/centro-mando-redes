param([string]$accion = 'lista', [long[]]$ids = @(), [int]$x = 0, [int]$y = 0, [int]$w = 683, [int]$h = 728)
Add-Type @"
using System; using System.Runtime.InteropServices; using System.Text; using System.Collections.Generic;
public class W {
 public delegate bool EP(IntPtr h, IntPtr l);
 [DllImport("user32.dll")] public static extern bool EnumWindows(EP p, IntPtr l);
 [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
 [DllImport("user32.dll")] public static extern int GetClassName(IntPtr h, StringBuilder s, int n);
 [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
 [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h);
 [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
 [DllImport("user32.dll")] public static extern bool MoveWindow(IntPtr h,int x,int y,int w,int ht,bool r);
 [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h,int c);
 [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
 public struct RECT { public int L,T,R,B; }
 public static List<string> Lista() { var o=new List<string>(); EnumWindows((hh,l)=>{ var c=new StringBuilder(100); GetClassName(hh,c,100); if(c.ToString()=="Chrome_WidgetWin_1" && IsWindowVisible(hh)){ var s=new StringBuilder(200); GetWindowText(hh,s,200); RECT r; GetWindowRect(hh,out r); o.Add(hh.ToInt64()+" | "+s+" | iconic="+IsIconic(hh)+" | "+r.L+","+r.T+","+r.R+","+r.B);} return true;}, IntPtr.Zero); return o; }
}
"@
if ($accion -eq 'lista') { [W]::Lista() }
if ($accion -eq 'colocar') { foreach ($i in $ids) { [W]::ShowWindow([IntPtr]$i, 9) | Out-Null; [W]::MoveWindow([IntPtr]$i, $x, $y, $w, $h, $true) | Out-Null; [W]::SetForegroundWindow([IntPtr]$i) | Out-Null } }
if ($accion -eq 'minimizar') { foreach ($i in $ids) { [W]::ShowWindow([IntPtr]$i, 6) | Out-Null } }
