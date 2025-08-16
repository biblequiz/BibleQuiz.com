import React, { useState, type ReactEventHandler } from 'react';
import { useStore } from '@nanostores/react';
import FontAwesomeIcon from './FontAwesomeIcon';
import Dialog from './Dialog.tsx';
import { ChurchesService, ChurchResultFilter } from '../types/services/ChurchesService.ts';
import { sharedAuthManager } from '../utils/SharedState.ts';

export interface SelectedChurch {
  id: string;
  displayName: string;
}

interface Props {
  required: boolean;
  currentChurch?: SelectedChurch | null;
}

export default function ChurchLookup({ required, currentChurch }: Props) {

  const authManager = useStore(sharedAuthManager);

  const [searchText, setSearchText] = useState("");
  const [selectedChurch, setSelectedChurch] = useState(currentChurch || null);
  const [isChurchDialogOpen, setIsChurchDialogOpen] = useState(false);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [churchResults, setChurchResults] = useState([]);

  function handleClick(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Enter") {
      startSearch();
    }
  }

  async function startSearch(): Promise<void> {
    setIsLoadingResults(true);

    const token = await authManager.getLatestAccessToken();
    const churchService = new ChurchesService(token);
    churchService.getChurches(
      (churches, pageCount) => {
        setIsLoadingResults(false);
        if (churches.length > 0) {
          setSelectedChurch({
            id: churches[0].Id,
            displayName: `${churches[0].Name}, ${churches[0].PhysicalAddress.City}, ${churches[0].PhysicalAddress.State}`
          });

          setIsChurchDialogOpen(false);
        } else {
          alert("No churches found matching your search criteria.");
        }
      },
      (error) => {
        setIsLoadingResults(false);
        alert("Error retrieving churches: " + error);
      },
      10, // Page size
      0, // Page number
      searchText,
      null, // Region ID
      null, // District ID
      ChurchResultFilter.All); // List All churches.
  }

  return (
    <>
      <input
        type="text"
        className="input input-bordered grow"
        placeholder="Select a Church"
        value={currentChurch?.displayName || ""}
        readOnly
        required={required ?? false}
      />
      <button
        type="button"
        className="btn btn-primary"
        onClick={e => setIsChurchDialogOpen(true)}
      >
        <FontAwesomeIcon icon="fas faSearch" />
      </button>

      <Dialog isOpen={isChurchDialogOpen} width="max-w-full">
        <h3 className="font-bold text-lg mb-4">Select a Church</h3>
        <div className="grid grid-cols-1">
          <div className="w-full flex">
            <input
              type="text"
              name="churchName"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onKeyDown={handleClick}
              placeholder="Search by name or location"
              className="input input-bordered w-full"
              tabIndex={0}
              disabled={isLoadingResults}
              required
            />
            <button
              type="button"
              className="btn btn-primary ml-2"
              disabled={!searchText || searchText.length === 0 || isLoadingResults}
              onClick={e => startSearch()}
            >
              <FontAwesomeIcon icon="fas faSearch" />
            </button>
          </div>
          <div className="text-xs mt-2">
            <p>You can search with the following (in whole or part):</p>
            <ul className="list-disc pl-5">
              <li>
                <i>Church Name</i> (e.g. Cedar Park)
              </li>
              <li>
                <i>City, State</i> (e.g. Seattle, WA)
              </li>
              <li>
                <i>Church Name, City, State</i> (e.g. Cedar Park, Seattle, WA)
              </li>
              <li>
                <i>Church Name, Street Address, City, State</i> (e.g. Cedar Park, 123 Any Street, Seattle, WA)
              </li>
            </ul>
          </div>
        </div>
      </Dialog>
    </>);
}