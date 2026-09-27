Jekyll::Hooks.register :site, :post_write do |site|
  # Use backslashes appropriately for Windows paths
  ps_script = File.expand_path("after_build.ps1", site.source).gsub('/', '\\')

  if File.exist?(ps_script)
    Jekyll.logger.info "PowerShell Hook:", "Spawning background script..."
    
    begin
      # Passing arguments as an array prevents injection crashes and handles spaces in Windows paths flawlessly
      pid = Process.spawn(
         "powershell.exe", 
         "-NoProfile", 
         "-ExecutionPolicy", "Bypass", 
      #   "-WindowStyle", "Hidden", 
         "-File", ps_script
      )
      
      # Detach tells Ruby not to wait around or monitor the process lifecycle
      Process.detach(pid)
      
    rescue Exception => e
      Jekyll.logger.error "PowerShell Hook Error:", "#{e.class}: #{e.message}"
    end
  else
    Jekyll.logger.warn "PowerShell Hook:", "Could not find script at #{ps_script}"
  end
end
