export default function addToast(e: CustomEvent): void {
  const outlet = document.getElementById('outlet');
  const toast = document.createElement('global-toast');
  toast.message = e.detail;
  outlet.appendChild(toast);
}
