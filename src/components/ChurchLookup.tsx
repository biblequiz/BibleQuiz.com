import React, { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import FontAwesomeIcon from './FontAwesomeIcon';
import { Church, ChurchesService, ChurchResultFilter } from '../types/services/ChurchesService.ts';
import { sharedAuthManager } from '../utils/SharedState.ts';
import { type RemoteServicePage, type RemoteServiceError } from '../types/services/RemoteServiceUtility.ts';
import Pagination from './Pagination.tsx';

export interface SelectedChurch {
  id: string;
  displayName: string;
}

interface Props {
  regionId?: string;
  districtId?: string;
  required?: boolean;
  disabled?: boolean;
  currentChurch?: SelectedChurch | null;
  onSelect: (church: SelectedChurch) => void;
}

interface ChurchSearchState {
  regionId: string | null;
  districtId: string | null;
  isLoading: boolean;
  pageNumber: number;
  page: RemoteServicePage<Church> | null;
  pageSize: number;
  error: RemoteServiceError | null;
}

export default function ChurchLookup({ regionId, districtId, required, disabled, currentChurch, onSelect }: Props) {

  const authManager = useStore(sharedAuthManager);

  const [searchText, setSearchText] = useState(currentChurch?.displayName || "");
  const [searchState, setSearchState] = useState(null as ChurchSearchState | null);

  useEffect(() => {
    if (searchState?.regionId !== regionId || searchState?.districtId !== districtId) {
      startSearch(searchState?.pageNumber, searchState?.pageSize);
    }
  }, [regionId, districtId]);

  function handleEnter(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Enter") {
      startSearch();
    }
  }

  async function startSearch(newPageNumber?: number, newPageSize?: number): Promise<void> {

    const pageNumber = newPageNumber ?? 0;
    const pageSize = newPageSize ?? searchState?.pageSize ?? 10;

    if (!searchText || searchText.trim() === "") {
      setSearchState(null);
      return;
    }

    setSearchState({
      isLoading: true,
      regionId: regionId ?? null,
      districtId: districtId ?? null,
      pageNumber: pageNumber,
      pageSize: pageSize,
      page: null,
      error: null
    });

    ChurchesService.getChurches(
      authManager,
      pageSize, // Page size
      pageNumber, // Page number
      searchText,
      regionId ?? null, // Region ID
      districtId ?? null, // District ID
      ChurchResultFilter.All)// List All churches.
      .then((page => {
        setSearchState({
          isLoading: false,
          regionId: regionId ?? null,
          districtId: districtId ?? null,
          pageNumber: pageNumber,
          pageSize: pageSize,
          page: page,
          error: null
        });
      }))
      .catch((error) => {
        setSearchState({
          isLoading: false,
          regionId: regionId ?? null,
          districtId: districtId ?? null,
          pageNumber: pageNumber,
          pageSize: pageSize,
          page: null,
          error: error
        });
      });
  }

  function selectChurch(church: Church): void {
    const displayName = `${church.Name}, ${church.PhysicalAddress.City}, ${church.PhysicalAddress.State}`;

    setSearchText(displayName);
    setSearchState(null); // Clear search state after selection

    onSelect({ id: church.Id, displayName });
  }

  return (
    <>
      <div className="relative flex gap-2">
        <input
          type="text"
          className="input input-bordered grow"
          placeholder="Name or location"
          value={searchText}
          onKeyDown={handleEnter}
          onChange={e => setSearchText(e.target.value)}
          required={required ?? false}
          disabled={(searchState?.isLoading ?? false) || (disabled ?? false)}
        />
        {!disabled && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={e => startSearch()}
            disabled={searchState?.isLoading ?? false}
          >
            <FontAwesomeIcon icon="fas faSearch" />
            Search
          </button>)}
      </div>
      {!disabled && (
        <span className="text-xs">
          Enter <b>Name</b> (e.g., "Cedar Park"), <b>City & State</b> (e.g., "Seattle, WA"), or <b>both</b> (e.g., "Cedar Park, Bothell, WA"), and then click <b>Search</b>.
        </span>)}
      {searchState && (
        <fieldset className="fieldset border-base-300 rounded-box w-full border p-4 relative flex gap-2 mt-2">
          <legend className="fieldset-legend">Church Search Results</legend>
          {searchState.isLoading && (
            <>
              <span className="loading loading-spinner loading-sm"></span>&nbsp;
              <span className="text-sm">
                Searching ...
              </span>
            </>)}
          {!searchState.isLoading && (
            <>
              {searchState.error && (
                <div role="alert" className="alert alert-error">
                  <FontAwesomeIcon icon="fas faCircleExclamation" />
                  <div>
                    <b>Error: </b> {searchState.error.message}
                  </div>
                </div>)}
              {searchState.page && (
                <div className="w-full mt-0">
                  {searchState.page.Items.length === 0 && (
                    <div className="text-sm">
                      No churches found matching your search criteria.
                    </div>)}
                  {searchState.page.Items.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="table table-s table-nowrap w-full">
                        <tbody>
                          {searchState.page.Items.map((church) => (
                            <tr key={`church_${church.Id}`}>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => selectChurch(church)}
                                >
                                  Select
                                </button>
                              </td>
                              <td className="w-full">
                                <b>{church.Name}</b><br />
                                {church.PhysicalAddress.StreetAddress}, {church.PhysicalAddress.City}, {church.PhysicalAddress.State}
                              </td>
                            </tr>))}
                        </tbody>
                      </table>
                      <Pagination
                        currentPage={searchState.pageNumber + 1}
                        pageCount={searchState.page.PageCount!}
                        pageSize={searchState.pageSize}
                        setPageSettings={(newPageNumber, newPageSize) => {
                          startSearch(newPageNumber - 1, newPageSize);
                        }} />
                    </div>)}
                </div>)}
            </>)}
        </fieldset>
      )}
    </>);
}