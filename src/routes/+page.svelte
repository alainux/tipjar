<script>
	import { onMount } from 'svelte';
	import { ethers } from 'ethers';
	import TipJarABI from '../artifacts/src/contracts/TipJar.sol/TipJar.json';

	let userAddress = null;
	let network = null;
	let balance = null;
	let isConnected = false;

	const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
	let contract = null;
	let allTips = [];

	async function setupContract() {
		if (isConnected) {
			contract = new ethers.Contract(contractAddress, TipJarABI.abi.provider);
			contract.on('NewTip', async () => {
				balance = await provider.getBalance(userAddress);
			});
		}
	}

	async function getAllTips() {
		if (isConnected) {
			const tips = await contract.getAllTips();
			allTips = tips.map((item) => {
				return {
					...item,
					timestamp: new Date(item.timestamp * 1000)
				};
			});
		}
	}

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

	<table class="mt-8 border-collapse table-auto w-2/3 mx-auto text-sm h-80 overflow-auto">
		<thead>
			<tr>
				<th class="border-b border-gray-600 font-medium p-4 pl-8 pt-0 pb-3 text-gray-400">
					Sender Address
				</th>
				<th class="border-b border-gray-600 font-medium p-4 pl-8 pt-0 pb-3 text-gray-400">
					Name
				</th>
				<th class="border-b border-gray-600 font-medium p-4 pl-8 pt-0 pb-3 text-gray-400">
					Message
				</th>
				<th class="border-b border-gray-600 font-medium p-4 pl-8 pt-0 pb-3 text-gray-400">
					Date
				</th>
				<th class="border-b border-gray-600 font-medium p-4 pl-8 pt-0 pb-3 text-gray-400">
					Amount
				</th>
			</tr>
		</thead>
	</table>
	<tbody>
		{#each allTips as item}
			<tr>
				<td class="border-b border-gray-700 p-4 pl- text-gray-500">
					{item.sender}
				</td>
				<td class="border-b border-gray-700 p-4 pl- text-gray-500">
					{item.name}
				</td>
				<td class="border-b border-gray-700 p-4 pl-8 text-gray-500">
					{item.message}
				</td>
				<td class="border-b border-gray-700 p-4 pl-8 text-gray-500">
					{item.timestamp}
				</td>
				<td class="border-b border-gray-700 p-4 pl-8 text-gray-500">
					{item.amount}
				</td>
			</tr>
		{/each}
	</tbody>
{:else}
	<button class="bg-blue-600 text-gray-50 shadow-md rounded-md px-3 py-8" on:click={connectWallet}>
		Connect with wallet
	</button>
{/if}
