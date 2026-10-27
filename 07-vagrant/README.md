# Partie IV – Première introduction à l'automatisation (Vagrant)

Vagrant est installé **dans la VM Ubuntu Server** (VirtualBox sur la machine physique Windows) et crée une seconde VM Ubuntu automatiquement : c'est de la virtualisation imbriquée.

## Prérequis : ressources et virtualisation

Sur la machine physique (VM éteinte), la virtualisation imbriquée est activée et la VM reçoit 4 Go de RAM :

```powershell
VBoxManage modifyvm "ubuntu-server-26" --nested-hw-virt on --memory 4096 --cpus 2
```

Windows utilisait la sécurité basée sur la virtualisation (**Intégrité de la mémoire**), qui lançait l'hyperviseur Hyper-V et empêchait VirtualBox de transmettre la virtualisation matérielle à la VM. Elle a été désactivée dans Sécurité Windows (Isolation du noyau), suivie d'un redémarrage.

Vérification dans la VM Ubuntu :

```bash
free -h
df -h /
nproc
egrep -c '(vmx|svm)' /proc/cpuinfo
```

Résultat : 3,3 Go de RAM, 14 Go libres, 2 CPU, et `egrep` affiche `2`. Le processeur est un **AMD** : il s'agit donc de l'extension `svm`.

![Ressources de la VM](screenshots/00-prerequis.png)

## Étape 15 – Installation de Vagrant et premier Vagrantfile

### Installation

Sous Ubuntu 26.04, `vagrant` et `vagrant-libvirt` ne sont pas disponibles dans les dépôts Ubuntu. QEMU et libvirt sont installés avec les paquets Ubuntu, Vagrant avec le dépôt officiel HashiCorp, et le plugin libvirt avec la commande `vagrant plugin` :

```bash
sudo apt install -y qemu-system-x86 libvirt-daemon-system libvirt-clients libvirt-dev build-essential pkg-config libxml2-dev libxslt1-dev zlib1g-dev ovmf
wget -O - https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com noble main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update
sudo apt install -y vagrant
vagrant plugin install vagrant-libvirt
sudo usermod -aG libvirt,kvm $USER
```

Après une déconnexion/reconnexion (pour que les nouveaux groupes soient pris en compte), vérification :

```bash
vagrant --version
vagrant plugin list
groups
sudo systemctl status libvirtd --no-pager | head -5
```

Résultat : Vagrant 2.4.9, plugin `vagrant-libvirt` 0.12.2, utilisateur dans les groupes `libvirt` et `kvm`, service `libvirtd` actif.

![Installation de Vagrant](screenshots/00b-installation-vagrant.png)

### Vagrantfile utilisé

```ruby
Vagrant.configure("2") do |config|
  config.vm.box = "cloud-image/ubuntu-24.04"
  config.vm.boot_timeout = 900

  config.vm.provider "libvirt" do |lv|
    lv.driver = "qemu"
    lv.cpu_mode = "custom"
    lv.cpu_model = "qemu64"
    lv.memory = 1024
    lv.loader = "/usr/share/ovmf/OVMF.fd"
  end
end
```

- `config.vm.box` : image de base (« box ») Ubuntu 24.04, téléchargée depuis le catalogue Vagrant.
- `config.vm.boot_timeout` : délai d'attente du démarrage, augmenté car l'émulation est lente.
- `lv.driver = "qemu"` : émulation logicielle, sans KVM.
- `lv.cpu_mode` / `lv.cpu_model` : processeur virtuel générique, compatible avec l'émulation.
- `lv.memory = 1024` : 1 Go de RAM pour la VM.
- `lv.loader` : firmware UEFI (OVMF) utilisé pour le démarrage.

### Création de la VM

```bash
mkdir -p ~/vagrant-ubuntu && cd ~/vagrant-ubuntu
vagrant up --provider=libvirt
vagrant status
```

Vagrant télécharge la box, crée la VM dans libvirt, la démarre, attend qu'elle obtienne une adresse IP (ici `192.168.121.150`), puis configure l'accès SSH avec une clé générée automatiquement. `vagrant status` affiche `default  running (libvirt)`.

![vagrant up](screenshots/01-vagrant-up.png)

### Problèmes rencontrés

1. **KVM imbriqué fait planter VirtualBox** : avec `lv.driver = "kvm"`, la VM Ubuntu s'arrêtait en « guru meditation » (`VERR_SVM_UNKNOWN_EXIT` dans `VBox.log`). VirtualBox gère mal la virtualisation imbriquée sur processeur AMD. Solution : émulation logicielle avec `lv.driver = "qemu"` (plus lent, mais stable).

2. **« No bootable device »** : `vagrant up` restait bloqué sur `Waiting for domain to get an IP address...`. Une capture de l'écran de la VM a montré qu'elle ne trouvait aucun système à démarrer :

   ```bash
   virsh -c qemu:///system screenshot vagrant-ubuntu_default ~/screen.png
   ```

   L'inspection de l'image de la box a montré que son premier secteur était rempli de zéros : la box téléchargée était abîmée.

   ```bash
   qemu-io -r -f qcow2 -c "read -v 448 64" ~/.vagrant.d/boxes/cloud-image-VAGRANTSLASH-ubuntu-24.04/20260926.0.0/amd64/libvirt/box.img
   ```

   Solution : supprimer la box et sa copie dans le stockage libvirt, puis la retélécharger avec `vagrant up`. Après le nouveau téléchargement, le secteur se termine bien par la signature `55 aa` et la VM démarre.

   ```bash
   vagrant destroy -f
   virsh -c qemu:///system vol-delete --pool default cloud-image-VAGRANTSLASH-ubuntu-24.04_vagrant_box_image_20260926.0.0_box.img
   vagrant box remove cloud-image/ubuntu-24.04 --all --force
   vagrant up --provider=libvirt
   ```

3. **Démarrage UEFI** : la VM démarre avec le firmware UEFI OVMF (paquet `ovmf`), déclaré dans le Vagrantfile avec `lv.loader`.

## Étape 16 – Connexion avec vagrant ssh

Depuis la VM Ubuntu Server, dans le dossier du Vagrantfile :

```bash
cd ~/vagrant-ubuntu
vagrant ssh
```

On est alors connecté à la VM créée par Vagrant (utilisateur `vagrant`), sans mot de passe ni configuration de clé à faire soi-même. On en sort avec `exit`.

![vagrant ssh](screenshots/02-vagrant-ssh.png)

`vagrant ssh -c` permet aussi d'exécuter des commandes dans la VM sans ouvrir de session :

```bash
vagrant ssh -c "hostname; head -2 /etc/os-release; ip -4 a show ens5; free -h"
```

Résultat : nom d'hôte `ubuntu` (valeur par défaut de la box), Ubuntu 24.04.5 LTS, adresse `192.168.121.150` sur l'interface `ens5` (attribuée automatiquement par le réseau de gestion de vagrant-libvirt) et 955 Mi de RAM, pour 1 Go demandé dans le Vagrantfile.

![Commandes dans la VM Vagrant](screenshots/02b-vagrant-ssh-commandes.png)

### Comparaison avec la création manuelle de la VM

| | VM manuelle (VirtualBox) | VM Vagrant |
|---|---|---|
| Création | Assistant VirtualBox, ISO, installation d'Ubuntu pas à pas | Une commande : `vagrant up` |
| Configuration | Clics dans l'interface, difficile à reproduire à l'identique | Décrite dans un fichier texte (`Vagrantfile`), versionné avec Git |
| Accès SSH | Redirection de port, création et copie de la clé à la main | `vagrant ssh` : clé générée et configurée automatiquement |
| Reproductibilité | Il faut tout refaire à la main | `vagrant destroy` puis `vagrant up` recrée la même VM |
| Partage | Exporter une image lourde (.ova) | Partager le `Vagrantfile` (quelques lignes) |

Vagrant applique le principe de l'**Infrastructure as Code** : la VM est décrite par du code, ce qui la rend reproductible, versionnable et rapide à recréer.

## Étape 17 – Configuration automatique : nom, IP privée, mémoire, CPU

Le Vagrantfile est modifié pour décrire précisément la VM. Le nom de la machine changeant, l'ancienne VM est d'abord supprimée :

```bash
cd ~/vagrant-ubuntu
vagrant destroy -f
```

### Vagrantfile final

```ruby
Vagrant.configure("2") do |config|
  config.vm.box = "cloud-image/ubuntu-24.04"
  config.vm.boot_timeout = 900

  config.vm.define "devsecops-vm" do |vm|
    vm.vm.hostname = "devsecops-vm"
    vm.vm.network "private_network", ip: "192.168.50.10"

    vm.vm.provider "libvirt" do |lv|
      lv.default_prefix = ""
      lv.driver = "qemu"
      lv.cpu_mode = "custom"
      lv.cpu_model = "qemu64"
      lv.memory = 1536
      lv.cpus = 2
      lv.loader = "/usr/share/ovmf/OVMF.fd"
    end
  end
end
```

| Paramètre demandé | Ligne du Vagrantfile | Valeur |
|---|---|---|
| Nom de la VM | `config.vm.define` + `lv.default_prefix = ""` | `devsecops-vm` (dans Vagrant et dans libvirt) |
| Nom d'hôte | `vm.vm.hostname` | `devsecops-vm` |
| Adresse IP privée | `vm.vm.network "private_network"` | `192.168.50.10` |
| Mémoire | `lv.memory` | 1536 Mo |
| Nombre de CPU | `lv.cpus` | 2 |

### Création et vérification

```bash
vagrant up --provider=libvirt
vagrant status
vagrant ssh -c "hostname; ip -4 a | grep 192.168.50; nproc; free -h"
```

Résultat de `vagrant status` :

```
Current machine states:

devsecops-vm              running (libvirt)
```

Vérification dans la VM :

- `hostname` → `devsecops-vm`
- `ip -4 a` → `inet 192.168.50.10/24` sur l'interface `ens6`, ajoutée pour le réseau privé
- `nproc` → `2`
- `free -h` → 1,4 Gi de mémoire totale (1536 Mo, moins la part réservée par le noyau)

Par rapport au premier Vagrantfile de l'étape 15 (nom `ubuntu`, une seule adresse attribuée automatiquement, 955 Mi de RAM, 1 CPU), toute la configuration demandée est appliquée automatiquement au démarrage, sans aucune intervention manuelle.

![vagrant status et configuration de la VM](screenshots/03-vagrant-status.png)
