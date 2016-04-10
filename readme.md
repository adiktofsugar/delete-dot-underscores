Mac makes these ._<name> files for every file you change on a sd/usb drive.
Normally it's fine, but...sometimes it's not.

This is a node script that polls for volume changes, watches files on that volume, and deletes the ._ files.

There's also a plist file that works for my computer. You should change it to match yours, or open a pull request to make it more globally accessible. Or open an issue and I probably will.

### Danger notes
- it runs as root, to be able to delete the files (I'm not sure why that's important)
- actually detect what kind of drive it is, so it could run on your hard drive
- it only has very simple volume checking. I only need it for my own use, so it's checking for "NO NAME"
- this is only tested on my machine. use at your own risk

### How to run
`sudo npm start` - it's a forever process, so it should just start in the foreground. When you put a sd/usb card in, it'll start watching.

### How to install as a launch daemon
*You should change the plist file before using it!!*
Everything's specific to my setup and I don't feel like making an install script, so change:
    - `WorkingDirectory` to be wherever this repo is
    - `EnvironmentVariables.PATH` to include the npm binary
As root, you can just run the command in the "install_as_daemon" package.json script, which just copies the plist file to /Library/LaunchDaemons/.
Then...it should start on boot, but you can also run `sudo launchctl load /Library/LaunchDaemons/local.deletedotunderscore.plist`
