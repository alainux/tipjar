<script>
	import { onMount } from 'svelte';
	import { ethers } from 'ethers';
	import TipJarABI from '../artifacts/src/contracts/TipJar.sol/TipJar.json';

	let userAddress = null;
	let network = null;
	let balance = null;
	let isConnected = false;
	let provider = null;

	const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
	let contract = null;
	let allTips = [];
	let sendingTip = false;

	async function sendTip(event) {
		sendingTip = true;
		const formData = new FormData(event.target);
		const data = {};
		for (let field of formData) {
			const [key, value] = field;
			data[key] = value;
		}
		const rwContract = new ethers.Contract(contractAddress, TipJarABI.abi, provider.getSigner());
		const tx = await rwContract.sendTip(data.message, data.name, {
			value: ethers.utils.parseEther(data.amount)
		});
		await tx.wait();
	}

	async function setupContract() {
		if (isConnected) {
			contract = new ethers.Contract(contractAddress, TipJarABI.abi, provider);
			contract.on('NewTip', async () => {
				balance = await provider.getBalance(userAddress);
				await getAllTips();
				sendingTip = false;
			});
		}
	}

	async function getAllTips() {
		if (isConnected) {
			const tips = await contract.getAllTips();
			allTips = [
				...tips.map((item) => {
					return {
						address: item.sender,
						timestamp: new Date(item.timestamp * 1000).toLocaleDateString(),
						message: item.message,
						name: item.name,
						amount: ethers.utils.formatEther(item.amount.toString())
					};
				})
			];
		}
	}

	async function setup(accounts) {
		userAddress = accounts[0];
		try {
			provider = new ethers.providers.Web3Provider(window.ethereum);
			network = await provider.getNetwork();
			balance = await provider.getBalance(userAddress);
			isConnected = true;
			await setupContract();
			await getAllTips();
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

	<form
		class="w-2/3 mx-auto border rounded-md border-indigo-200 flex flex-col gap-8 p-6 mt-4"
		on:submit|preventDefault={sendTip}
	>
		<div class="grid grid-cols-2">
			<label for="amount">Send me an ETH tip!</label>
			<input name="amount" placeholder="0.001" />
		</div>
		<div class="grid grid-cols-2">
			<label for="name">Your name</label>
			<input name="name" />
		</div>
		<div class="grid grid-cols-2">
			<label for="message">Your message</label>
			<input name="message" />
		</div>
		<button
			disabled={sendingTip}
			type="submit"
			class="bg-green-500 text-gray-50 shadow-md rounded-md px-2 py-2 text-center w-1/3"
			>Send a tip</button
		>
	</form>
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
	</table>
{:else}
	<button class="bg-blue-600 text-gray-50 shadow-md rounded-md px-3 py-8" on:click={connectWallet}>
		Connect with wallet
	</button>
{/if}
