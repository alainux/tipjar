<script>
	import { onMount } from 'svelte';
	import { ethers } from 'ethers';

	let userAddress = null;
	let network = null;
	let balance = null;
	let isConnected = false;

	async function setup(accounts) {
		userAddress = accounts[0];
		try {
			const provider = new ethers.providers.Web3Provider(window.ethereum);
			network = await provider.getNetwork();
			balance = await provider.getBalance(userAddress);
			isConnected = true;
		} catch (error) {
			console.error(error);
		}
	}

	async function connectWallet() {
		if (window.ethereum) {
			const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
			if (accounts.length > 0) {
				await setup(accounts);
			} else {
				alert('No accounts found');
			}
		} else {
			alert('No ethereum wallet found');
		}
	}

	onMount(async () => {
		if (window.ethereum) {
			const accounts = await window.ethereum.request({ method: 'eth_accounts' });
			if (accounts.length > 0) {
				await setup(accounts);
			}
		}
	});
</script>

{#if isConnected}
	<p class="text-xl text-green-600">
		Successfully connected to account <strong>{userAddress}</strong>
	</p>

	<ul>
		<li>Current network: {network.name}</li>
		<li>Current balance: {ethers.utils.formatEther(balance)}</li>
	</ul>
{:else}
	<button class="bg-blue-600 text-gray-50 shadow-md rounded-md px-3 py-8" on:click={connectWallet}>
		Connect with wallet
	</button>
{/if}
