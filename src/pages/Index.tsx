import { useState, useEffect, useCallback } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { getAddress } from "viem";
import { Briefcase, FileSearch, Zap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import ResumeInput from "@/components/ResumeInput";
import ConsensusLoader from "@/components/ConsensusLoader";
import AuditResults from "@/components/AuditResults";
import { genlayerStudioNet } from "@/config/wagmi";
import { getGenLayerClient, submitScreening, getScreening } from "@/lib/genlayer";

const Index = () => {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [mustHaveSkills, setMustHaveSkills] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-switch to GenLayer network
  useEffect(() => {
    if (isConnected && chainId !== genlayerStudioNet.id) {
      switchChain({ chainId: genlayerStudioNet.id });
    }
  }, [isConnected, chainId, switchChain]);

  const handleSubmit = useCallback(async () => {
    if (!address || !jobTitle || !resumeText) return;
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const normalizedAddress = getAddress(address);
      const client = getGenLayerClient(normalizedAddress);

      await submitScreening(client, {
        jobTitle,
        jobDescription,
        mustHaveSkills,
        resumeText,
        userWalletAddress: normalizedAddress,
      });

      // Poll for results
      let attempts = 0;
      const poll = async (): Promise<any> => {
        attempts++;
        try {
          const res = await getScreening(client, normalizedAddress);
          if (res) return res;
        } catch {}
        if (attempts < 30) {
          await new Promise((r) => setTimeout(r, 3000));
          return poll();
        }
        throw new Error("Timeout waiting for consensus");
      };

      const result = await poll();
      setResults(result);
    } catch (e: any) {
      setError(e?.message || "Transaction failed");
    } finally {
      setLoading(false);
    }
  }, [address, jobTitle, jobDescription, mustHaveSkills, resumeText]);

  const canSubmit = isConnected && jobTitle.trim() && resumeText.trim() && !loading;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
        {/* Hero */}
        <div className="text-center space-y-3">
          <h2 className="text-3xl md:text-4xl font-extrabold gradient-text glow-text">
            AI-Powered Resume Screening
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
            Submit your resume for a decentralized AI audit on GenLayer. Get transparent, consensus-driven hiring insights recorded on-chain.
          </p>
        </div>

        {/* Job Details */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-primary" /> Job Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Job Title *</label>
              <input
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g. Senior Frontend Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Must-Have Skills</label>
              <input
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g. React, TypeScript, Node.js"
                value={mustHaveSkills}
                onChange={(e) => setMustHaveSkills(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Job Description</label>
            <textarea
              className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              rows={3}
              placeholder="Paste the job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Resume Input */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <FileSearch className="w-4 h-4 text-primary" /> Resume / CV
          </h3>
          <ResumeInput resumeText={resumeText} onResumeTextChange={setResumeText} />
        </div>

        {/* Submit */}
        <div className="flex flex-col items-center gap-3">
          <Button
            size="lg"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="gradient-primary text-primary-foreground font-semibold px-8 py-3 text-base hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Run Decentralized AI Audit
          </Button>
          {!isConnected && (
            <p className="text-xs text-muted-foreground">Connect your wallet to begin</p>
          )}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        {/* Loading / Results */}
        {loading && <ConsensusLoader />}
        {results && !loading && <AuditResults data={results} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6 mt-12">
        <div className="container mx-auto px-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Zap className="w-3.5 h-3.5 text-primary" />
          Powered by GenLayer Blockchain
        </div>
      </footer>
    </div>
  );
};

export default Index;
