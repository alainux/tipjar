<script>
	import { onMount } from 'svelte';
	import { ethers } from 'ethers';
	import TipJarABI from '../../artifacts/src/contracts/TipJar.sol/TipJar.json';

	let userAddress = null;
	let network = null;
	let balance = null;
	let isConnected = false;
	let provider = null;

	const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;

	let amItheOwner = false;

	let contract = null;
	let allTips = [];
	let contractBalance = null;
	let isWithdrawing = false;

	async function setupContract() {
		if (isConnected) {
			contract = new ethers.Contract(contractAddress, TipJarABI.abi, provider);
			const contractOwner = await contract.owner();
			amItheOwner = ethers.utils.getAddress(contractOwner) === ethers.utils.getAddress(userAddress);

			contract.on('NewWithdrawal', async () => {
				contractBalance = await provider.getBalance(contractAddress);
				balance = await provider.getBalance(userAddress);
				isWithdrawing = true;
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
			contractBalance = await provider.getBalance(contractAddress);
			isConnected = true;
			await setupContract();
			await getAllTips();

			window.ethereum.on('accountsChanged', (accounts) => {
				window.location.reload();
			});
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

	async function withdraw() {
		if (isConnected) {
			isWithdrawing = true;
			const rwContract = new ethers.Contract(contractAddress, TipJarABI.abi, provider.getSigner());
			const tx = await rwContract.withdraw();
			await tx.wait();
		}
	}
</script>

{#if isConnected}
	<h1 class="text-3x1 text-gray-800 p-8">Withdraw from the TipJar contract</h1>

	<div class="text-sm text-gray-500 pb-4 flex flex-col gap-4">
		<p class="text-xl text-green-600">
			Successfully connected to account <strong>{userAddress}</strong>
		</p>

		<ul>
			<li>Current network: {network.name}</li>
			<li>Your current balance: {ethers.utils.formatEther(balance)}</li>
			<li>Current contract balance: {ethers.utils.formatEther(contractBalance)}</li>
		</ul>

		{#if amItheOwner}
			{#if contractBalance.eq(0)}
				<p class="text-cl text-red-600">There is no balance to withdraw</p>
			{/if}
			<button
				class="bg-blue-600 text-gray-50 shadow-md rounded-md px-3 py-8 text-center disabled:opacity-25"
				disabled={isWithdrawing || contractBalance.eq(0)}
			>
				{isWithdrawing ? '...Withdrawing' : 'Withdraw'}
			</button>
		{:else}
			<p class="text-cl text-red-600">Only the owner of the contract can withdraw the balanace</p>
		{/if}
	</div>

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
