import clsx from "clsx";
import { Icons } from "@/components/ui/icons-assets";
import { useRef, useState } from "react";
import { useWeb3Wallet } from "../walletconnect";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { PowerIcon } from "lucide-react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import MobileTransport from "../walletconnect/MobileTransport";

export default function WalletConnectModal() {
	const [uri, setUri] = useState("");
	const [loading, setLoading] = useState(false);
	const { w, sessionProposals, sessionRequests, activeSessions } =
		useWeb3Wallet("wss://relay.walletconnect.org");
	const readerRef = useRef<HTMLInputElement | null>(null);
	const { resolvedTheme } = useTheme();

	async function pasteFromClipboard() {
		try {
			const clipboardItems = await navigator.clipboard.read();

			for (const clipboardItem of clipboardItems) {
				const textTypes =
					clipboardItem.types.filter((type) =>
						type.startsWith("text/"),
					) ?? [];

				for (const textType of textTypes) {
					const text = await (
						await clipboardItem.getType(textType)
					).text();

					setUri(text);
					break;
				}
			}
		} catch (err) {
			console.error(err);
		}
	}

	return (
		<div className="max-w-[520px] w-[520px] pb-5">
			<div className="flex items-center justify-between gap-2">
				<div>
					<p className="text-5xl font-display font-bold pb-2 tracking-[0.24px]">
						Connect dApp
					</p>
					<p>Paste a paring code to connect a dApp to Space</p>
				</div>
				<img src="/images/wc.svg" alt="" />
			</div>

			<div id="reader" ref={readerRef} style={{ display: "none" }} />
			<div className="flex flex-row w-full relative mt-10 mb-12">
				{uri && (
					<div className="absolute left-5 top-3 text-xs text-muted-foreground">
						Pairing code
					</div>
				)}
				<Input
					type="text"
					placeholder="Pairing code"
					value={uri}
					className={clsx(
						"h-[60px]  pr-[90px] pl-5 text-left bg-border-quaternary border-transparent rounded-lg focus-visible:!ring-0 focus-visible:!ring-offset-0 ring-0 focus-visible:border-2 border-2 focus-visible:border-pixel-pink border-solid",
						uri ? "pt-6 pb-1" : "py-3",
					)}
					onChange={(e) => setUri(e.target.value)}
				/>
				<button
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						pasteFromClipboard();
					}}
					className="absolute top-1/2 right-4 -translate-y-1/2 text-muted-foreground px-1 font-semibold py-2 hover:text-foreground transition-all duration-200"
				>
					Paste
				</button>
			</div>

			{/* <Button
				disabled={loading}
				type="submit"
				size={"sm"}
				// className="absolute top-1/2 right-5 -translate-y-1/2"
			>
				Connect
			</Button> */}

			<div>
				<form
					className="flex flex-row gap-4"
					onSubmit={async (e) => {
						e.preventDefault();
						try {
							setLoading(true);
							await w?.pair({ uri });
							console.log("WalletConnect session paired");
						} catch (error) {
							console.error(error);
						} finally {
							setUri("");
							setLoading(false);
						}
					}}
				></form>
			</div>
			{activeSessions.length > 0 ? (
				<div className="flex flex-col gap-4">
					<div className="flex flex-col flex-wrap gap-4">
						{activeSessions.map((s) => (
							<div
								key={s.peer.publicKey}
								className="grow p-4 bg-background rounded-xl"
							>
								<div>
									<div className="flex flex-row gap-2 justify-between">
										<div className="flex flex-row gap-4 items-center">
											<img
												className="w-8 h-8 stroke-current"
												onError={(e) => {
													const target =
														e.target as HTMLImageElement;
													target.src =
														resolvedTheme &&
														resolvedTheme ===
															"light"
															? "/app-fallback.svg"
															: "/app-fallback-dark.svg";
													target.onerror = null;
												}}
												src={
													s.peer.metadata.icons[0].startsWith(
														"http",
													)
														? s.peer.metadata
																.icons[0]
														: `${s.peer.metadata.url}${s.peer.metadata.icons[0]}`
												}
											/>
											<span className="text-sm flex flex-col text-muted-foreground">
												<span>
													{s.peer.metadata.name}
												</span>
												<span className="text-muted-foreground">
													Space #
													{localStorage.getItem(
														`WALLETCONNECT_SESSION_WS_${s.topic}`,
													) || ""}
												</span>
											</span>
										</div>
										<div>
											<Button
												disabled={!w}
												onClick={async () => {
													await w!.disconnectSession({
														topic: s.topic,
														reason: {
															code: 1,
															message:
																"user disconnected",
														},
													});
												}}
												variant="destructive"
												size={"sm"}
											>
												<PowerIcon className="h-4 w-4 text-foreground" />
											</Button>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			) : (
				<div>
					<MobileTransport
						onData={(data) => {
							setUri(Buffer.from(data).toString());
						}}
					/>

					<div className="mt-12 mb-6 h-[1px] bg-border-quaternary" />

					<Accordion type="single" collapsible className="w-full">
						<AccordionItem
							value="item-1"
							className="border-b-0 p-0"
						>
							<AccordionTrigger className="font-sans text-sm p-0">
								How do I connect to a dApp?
							</AccordionTrigger>
							<AccordionContent className="pt-4">
								<ol className="list-decimal space-y-1">
									<li>Open a WalletConnect supported dApp</li>
									<li>Connect a wallet</li>
									<li>Select WalletConnect as the wallet</li>
									<li>
										Copy the pairing code, paste it into the
										input field above
									</li>
									<li>Approve the session</li>
									<li>
										Your dApp is now connected to SpaceWard
									</li>
								</ol>
							</AccordionContent>
						</AccordionItem>
					</Accordion>
				</div>
			)}
		</div>
	);
}
